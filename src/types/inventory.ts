export type ProductType = 'single' | 'combo' | 'service';
export type StockUnit = 'unit' | 'kg' | 'g' | 'l' | 'ml' | 'box' | 'pack';
export type MovementType = 
  | 'in_purchase' 
  | 'out_sale' 
  | 'adjustment_add' 
  | 'adjustment_sub' 
  | 'damage' 
  | 'return';

export type AgtTaxRate = 'NOR_14' | 'RED_7' | 'RED_5' | 'ISE_0';

export interface Category {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  nif?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  cost_price?: number;
  manufacture_date?: string;
  expiration_date?: string;
  created_at: string;
}

export interface Product {
  id: string;
  organization_id: string;
  category_id?: string;
  supplier_id?: string;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  type: ProductType;
  unit: StockUnit;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  max_stock: number;
  current_stock: number;
  alert_expiration_days: number;
  tax_rate: AgtTaxRate;
  tax_exemption_code?: string;
  is_active: boolean;
  image_url?: string;
  category?: Category;
  supplier?: Supplier;
  batches?: ProductBatch[];
  created_at: string;
  updated_at: string;
}

export interface CreateProductDTO {
  category_id?: string;
  supplier_id?: string;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  type?: ProductType;
  unit?: StockUnit;
  cost_price: number;
  selling_price: number;
  min_stock?: number;
  max_stock?: number;
  tax_rate?: AgtTaxRate;
  tax_exemption_code?: string;
  image_url?: string;
}

export interface ProductFilterParams {
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
  expiringSoon?: boolean;
  page?: number;
  limit?: number;
}
