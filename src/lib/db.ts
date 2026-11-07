import Dexie, { Table } from "dexie";

export interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  deleted_at?: string | null;
  _synced?: boolean;
}

export interface SaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface Sale {
  id: string; // UUID v4 gerado no cliente
  total_amount: number;
  payment_method: string;
  items: SaleItem[];
  created_at: string;
  synced: boolean;
}

export interface OutboxEntry {
  id?: number; // Autoincrement local
  sale_id: string; // Idempotency Key
  payload: Sale;
  status: "pending" | "processing" | "failed";
  retry_count: number;
  created_at: string;
  error?: string;
}

export class WorscoiDB extends Dexie {
  products!: Table<Product, string>;
  sales!: Table<Sale>;
  outbox!: Table<OutboxEntry>;

  constructor() {
    super("WorscoiPOSDB");
    this.version(1).stores({
      products: "id, name, barcode, deleted_at, _synced",
    });
    this.version(2).stores({
      sales: "id, created_at, synced",
      outbox: "++id, sale_id, status, created_at",
    });
  }
}

export const WorscoiPOSDatabase = WorscoiDB;
export const db = new WorscoiDB();

