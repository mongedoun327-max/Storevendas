import Dexie, { type Table } from "dexie";

export interface OfflineSale {
  id?: number;
  tempId: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  createdAt: string;
  synced: number;
}

export interface CachedProduct {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  stock: number;
  categoryId: string | null;
  categoryName?: string;
  categoryColor?: string;
  updatedAt: string;
  deleted_at?: string | null;
  _synced?: boolean;
}

export interface CachedCategory {
  id: string;
  name: string;
  colorHex: string;
  deleted_at?: string | null;
  _synced?: boolean;
}

export class POSOfflineDatabase extends Dexie {
  sales!: Table<OfflineSale>;
  products!: Table<CachedProduct, string>;
  categories!: Table<CachedCategory, string>;

  constructor() {
    super("WorscoiPOS_OfflineDB");

    this.version(1).stores({
      sales: "++id, tempId, synced, createdAt",
    });

    this.version(2).stores({
      sales: "++id, tempId, synced, createdAt",
      products: "id, name, barcode, categoryId",
      categories: "id, name",
    });
  }
}

export const offlineDb = new POSOfflineDatabase();
