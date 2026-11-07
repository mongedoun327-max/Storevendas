export type AppFlowState = 
  | 'INTRO'
  | 'LOGIN'
  | 'APP_SHELL';

export type FlowStep = AppFlowState;

export interface UserSession {
  email: string;
  name: string;
  role: string;
  terminalId: string;
  isLoggedIn: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  pin: string;
  role: 'admin' | 'atendente';
  terminal: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'products'
  | 'service_orders'
  | 'sales'
  | 'cash_session'
  | 'expenses'
  | 'customers'
  | 'goals'
  | 'attendance'
  | 'reports'
  | 'audit'
  | 'settings';

export type NavigationTab = 
  | ActiveTab
  | 'services'
  | 'pos'
  | 'pdv';

export interface CashSession {
  id: string;
  operator_name: string;
  opened_at: string;
  closed_at?: string | null;
  initial_amount: number;
  actual_cash?: number | null;
  expected_cash: number;
  difference?: number | null;
  status: 'OPEN' | 'CLOSED';
  notes?: string | null;
}

export interface CashMovement {
  id?: string;
  session_id: string;
  type: 'SUPRIMENTO' | 'SANGRIA';
  amount: number;
  reason: string;
  created_at?: string;
}

export interface Expense {
  id?: string;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  payment_date?: string | null;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  supplier?: string;
  payment_method?: string;
  notes?: string;
  receiptPhoto?: string;
}

export interface NavItemConfig {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  iconName: string;
  badge?: number | string;
  badgeColor?: 'red' | 'green' | 'blue' | 'amber';
  tooltip: string;
  isPinnedBottom?: boolean;
}

export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock' | 'draft';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  saleType?: string;
  supplier?: string;
  batch?: string;
  expirationDate?: string;
  notes?: string;
  costPrice: number; // in Kz
  salePrice: number; // in Kz
  stock: number;
  minStock: number;
  unit: string;
  status: ProductStatus;
  imageUrl?: string;
  updatedAt: string;
}

export type WorkOrderStatus = 
  | 'pending'
  | 'diagnosing'
  | 'waiting_parts'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'canceled';

export type WorkOrderPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface WorkOrder {
  id: string;
  code: string; // e.g. OS-2026-089
  customerName: string;
  customerPhone: string;
  equipment: string;
  serialNumber?: string;
  reportedDefect: string;
  diagnosis?: string;
  technician: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  partsCost: number; // in Kz
  laborCost: number; // in Kz
  totalCost: number; // in Kz
  createdAt: string;
  estimatedDelivery: string;
  photos?: string[];
}

export interface Customer {
  id: string;
  name: string;
  nifOrBi: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number; // in Kz
  status: 'active' | 'inactive';
  lastPurchaseDate: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent?: number;
}

export type PaymentMethod = 
  | 'cash' // Dinheiro (Numerário)
  | 'multicaixa' // Multicaixa TPA
  | 'express' // Multicaixa Express
  | 'transfer' // Transferência Bancária
  | 'mixed'; // Misto

export interface SaleTransaction {
  id: string;
  invoiceNumber: string; // FT 2026/0012
  customerName: string;
  customerNif?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number; // IVA (e.g. 14% or 0% / Isento)
  total: number; // in Kz
  paymentMethod: PaymentMethod;
  cashierName: string;
  createdAt: string;
  status: 'paid' | 'pending' | 'canceled';
}

export interface CompanySettings {
  companyName: string;
  tradingName: string;
  nif: string;
  regimeIva: 'Regime Geral (14%)' | 'Regime Simplificado (7%)' | 'Regime de Exclusão (0%)';
  phone: string;
  email: string;
  address: string;
  city: string;
  agtCertificateNumber: string;
  posTerminalId: string;
  defaultCurrency: 'Kz' | 'USD' | 'EUR';
  printReceiptOnCheckout: boolean;
  allowNegativeStock: boolean;
  soundAlerts: boolean;
}

// Inventory & Stock Management Domain Types
export type { 
  ProductType, 
  StockUnit, 
  MovementType, 
  AgtTaxRate, 
  Category, 
  Supplier, 
  ProductBatch, 
  Product as InventoryProduct, 
  CreateProductDTO, 
  ProductFilterParams 
} from './inventory';

// SAF-T (AO) Fiscal Audit Domain Types
export type {
  SaftCompanyHeader,
  SaftCustomer,
  SaftProduct,
  SaftInvoiceLine,
  SaftInvoice
} from './saft';

// Offline Sales & Sync Queue Types
export type { OfflineSale } from '../services/offlineStorage';

// Cash Register Shift & Movement Domain Types
export type {
  MovementType as CashShiftMovementType,
  CashMovement as CashShiftMovement,
  ShiftRecord
} from './cash';
export * from './cash';
export * from './audit';
