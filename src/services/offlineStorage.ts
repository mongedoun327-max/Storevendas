/**
 * IndexedDB Offline Storage & Sync Queue para PDV Masakula / Worscoi POS
 * Permite operação contínua de vendas mesmo sem conectividade com a internet.
 */

export interface OfflineSale {
  id: string;
  createdAt: string;
  payload: Record<string, unknown>;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
}

const DB_NAME = "worscoi_pos_offline";
const DB_VERSION = 1;
const STORE_NAME = "sales_queue";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB não está disponível no ambiente atual."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const OfflineStorage = {
  async saveSale(salePayload: Record<string, unknown>): Promise<OfflineSale> {
    const db = await openDB();
    const offlineSale: OfflineSale = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      payload: salePayload,
      status: "pending",
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(offlineSale);

      req.onsuccess = () => resolve(offlineSale);
      req.onerror = () => reject(req.error);
    });
  },

  async getPendingSales(): Promise<OfflineSale[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const sales = (req.result as OfflineSale[]).filter(
          (s) => s.status === "pending" || s.status === "failed"
        );
        resolve(sales);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async updateSaleStatus(id: string, status: OfflineSale["status"], incrementRetry = false): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result as OfflineSale | undefined;
        if (item) {
          item.status = status;
          if (incrementRetry) item.retryCount += 1;
          store.put(item);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  },

  async removeSale(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },
};

export default OfflineStorage;
