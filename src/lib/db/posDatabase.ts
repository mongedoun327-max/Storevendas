import Dexie, { type Table } from "dexie";

export interface LocalSaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface LocalPendingSale {
  client_sale_id: string;
  shift_id: string;
  user_id: string;
  payment_method: "Numerário" | "Multicaixa" | "Transferência";
  total_amount: number;
  created_at: string;
  items: LocalSaleItem[];
  synced: 0 | 1;
}

export interface CachedProduct {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  barcode: string;
}

class WorscoiPOSDatabase extends Dexie {
  pendingSales!: Table<LocalPendingSale, string>;
  cachedProducts!: Table<CachedProduct, string>;

  constructor() {
    super("WorscoiPOS_DB");
    this.version(1).stores({
      pendingSales: "client_sale_id, synced, created_at",
      cachedProducts: "id, barcode, name",
    });
  }
}

export const db = new WorscoiPOSDatabase();
