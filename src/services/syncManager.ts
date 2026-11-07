import { OfflineStorage, OfflineSale } from "./offlineStorage";

export type SyncCallback = (count: number) => void;

export class SyncManager {
  private static isSyncing = false;

  public static initAutoSync(onSyncSuccess?: SyncCallback): void {
    if (typeof window === "undefined") return;

    // Escutar evento de reconexão à internet
    window.addEventListener("online", () => {
      console.log("Conexão restabelecida. A iniciar sincronização de vendas...");
      SyncManager.processQueue(onSyncSuccess);
    });

    // Tentativa periódica a cada 30 segundos se estiver online
    setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        SyncManager.processQueue(onSyncSuccess);
      }
    }, 30_000);
  }

  public static async processQueue(onSyncSuccess?: SyncCallback): Promise<void> {
    if (SyncManager.isSyncing || (typeof navigator !== "undefined" && !navigator.onLine)) return;

    SyncManager.isSyncing = true;
    let syncedCount = 0;

    try {
      const pendingSales = await OfflineStorage.getPendingSales();
      if (pendingSales.length === 0) {
        SyncManager.isSyncing = false;
        return;
      }

      for (const sale of pendingSales) {
        if (sale.retryCount > 5) {
          console.warn(`Venda ${sale.id} excedeu o limite de tentativas de sincronização.`);
          continue;
        }

        await OfflineStorage.updateSaleStatus(sale.id, "syncing");

        try {
          const response = await fetch("/api/sales/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sale.payload),
          });

          if (response.ok) {
            await OfflineStorage.removeSale(sale.id);
            syncedCount++;
          } else {
            await OfflineStorage.updateSaleStatus(sale.id, "failed", true);
          }
        } catch (err) {
          console.error(`Erro de rede ao sincronizar ${sale.id}:`, err);
          await OfflineStorage.updateSaleStatus(sale.id, "failed", true);
        }
      }

      if (syncedCount > 0 && onSyncSuccess) {
        onSyncSuccess(syncedCount);
      }
    } finally {
      SyncManager.isSyncing = false;
    }
  }
}

export default SyncManager;
