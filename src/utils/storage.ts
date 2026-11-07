import { Product, WorkOrder, Customer, SaleTransaction, CompanySettings, UserSession, Expense, CashSession, CashMovement } from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_WORK_ORDERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SALES, 
  INITIAL_SETTINGS,
  INITIAL_EXPENSES,
  INITIAL_CASH_SESSION,
  INITIAL_CASH_MOVEMENTS
} from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'masakula_products',
  WORK_ORDERS: 'masakula_orders',
  CUSTOMERS: 'masakula_customers',
  SALES: 'masakula_sales',
  EXPENSES: 'masakula_expenses',
  CASH_SESSION: 'masakula_cash_session',
  CASH_MOVEMENTS: 'masakula_cash_movements',
  SETTINGS: 'masakula_settings',
  USER_SESSION: 'masakula_user_session',
  FLOW_STATE: 'masakula_app_flow_state',
} as const;

export function loadStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar produtos do localStorage:', err);
  }
  return [];
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.warn('Erro ao salvar produtos no localStorage:', err);
  }
}

export function loadStoredWorkOrders(): WorkOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORK_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar Ordens de Serviço do localStorage:', err);
  }
  return [];
}

export function saveStoredWorkOrders(workOrders: WorkOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(workOrders));
  } catch (err) {
    console.warn('Erro ao salvar Ordens de Serviço no localStorage:', err);
  }
}

export function loadStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar clientes do localStorage:', err);
  }
  return [];
}

export function saveStoredCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (err) {
    console.warn('Erro ao salvar clientes no localStorage:', err);
  }
}

export function loadStoredSales(): SaleTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar vendas do localStorage:', err);
  }
  return [];
}

export function saveStoredSales(sales: SaleTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  } catch (err) {
    console.warn('Erro ao salvar vendas no localStorage:', err);
  }
}

export function loadStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar despesas do localStorage:', err);
  }
  return [];
}

export function saveStoredExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (err) {
    console.warn('Erro ao salvar despesas no localStorage:', err);
  }
}

export function loadStoredCashSession(): CashSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CASH_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.status === 'OPEN') return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar sessão de caixa do localStorage:', err);
  }
  return null;
}

export function saveStoredCashSession(session: CashSession | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.CASH_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CASH_SESSION);
    }
  } catch (err) {
    console.warn('Erro ao salvar sessão de caixa no localStorage:', err);
  }
}

export function loadStoredCashMovements(): CashMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CASH_MOVEMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Erro ao carregar movimentos de caixa do localStorage:', err);
  }
  return [];
}

export function saveStoredCashMovements(movements: CashMovement[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CASH_MOVEMENTS, JSON.stringify(movements));
  } catch (err) {
    console.warn('Erro ao salvar movimentos de caixa no localStorage:', err);
  }
}

export function loadStoredSettings(): CompanySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          defaultCurrency: 'Kz',
        };
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar configurações do localStorage:', err);
  }
  return INITIAL_SETTINGS;
}

export function saveStoredSettings(settings: CompanySettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('Erro ao salvar configurações no localStorage:', err);
  }
}

export function resetToBlankSystem(): void {
  try {
    // Esvazia completamente todas as abas e coleções locais
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CASH_MOVEMENTS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.CASH_SESSION);

    // Esvazia metas e dados de atendentes
    localStorage.setItem('masakula_goals', JSON.stringify([]));
    localStorage.setItem('masakula_goals_cleared', 'true');
    localStorage.setItem('masakula_clean_slate_session_v7', 'done');
    localStorage.setItem('masakula_system_blank', 'true');
    localStorage.setItem('masakula_audit_losses_v1', JSON.stringify([]));

    // Remove chaves antigas e caches auxiliares
    localStorage.removeItem('masakula_products_db_v1');
    localStorage.removeItem('masakula_work_orders_db_v1');
    localStorage.removeItem('masakula_shift_records');
    localStorage.removeItem('masakula_audit_divergences');
    localStorage.removeItem('cart-storage');
    localStorage.removeItem('masakula_trash_items');
    localStorage.removeItem('masakula_pos_held_sales');
    localStorage.removeItem('masakula_categories_cache_v1');
    localStorage.removeItem('masakula_operators_v1');
    localStorage.removeItem('masakula_metas_cache_v1');
    localStorage.removeItem('masakula_active_shift');
    localStorage.removeItem('masakula_pos_cart');
    localStorage.removeItem('view_dead_stock_cache');
    localStorage.removeItem('masakula_clean_slate_session_v4');
    localStorage.removeItem('masakula_clean_slate_session_v5');
  } catch (err) {
    console.warn('Erro ao resetar para sistema em branco:', err);
  }
}

export function resetToDemoData(): void {
  resetToBlankSystem();
}
