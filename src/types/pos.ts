export interface POSProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string | null;
  categoryName?: string;
  categoryColor?: string;
  barcode?: string;
}

export interface CartItem {
  product: POSProduct;
  quantity: number;
  subtotal: number;
}

export type PaymentMethod = "MULTICAIXA" | "CASH" | "TRANSFER";
