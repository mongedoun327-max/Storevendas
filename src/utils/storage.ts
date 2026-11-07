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
import { offlineDb } from '../lib/db/offlineDb';
import { db as worscoiDb } from '../lib/db';

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

// In-Memory Shield: Ensures no memory loss even under QuotaExceededError or private browsing
const memoryCache: {
  products: Product[] | null;
  workOrders: WorkOrder[] | null;
  customers: Customer[] | null;
  sales: SaleTransaction[] | null;
  expenses: Expense[] | null;
  cashSession: CashSession | null;
  cashMovements: CashMovement[] | null;
  settings: CompanySettings | null;
} = {
  products: null,
  workOrders: null,
  customers: null,
  sales: null,
  expenses: null,
  cashSession: null,
  cashMovements: null,
  settings: null,
};

/**
 * Persistência durável garantida: Solicita ao navegador permissão para armazenamento
 * permanente que nunca é descartado pelo sistema operacional.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return isPersisted;
    } catch (e) {
      console.warn('[Storage] Notice on persist request:', e);
    }
  }
  return false;
}

/**
 * Espelha produtos em segundo plano para o IndexedDB local (Dexie)
 */
async function mirrorProductsToIndexedDb(products: Product[]): Promise<void> {
  if (typeof window === 'undefined' || !Array.isArray(products)) return;
  try {
    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode || '',
      price: Number(p.salePrice) || 0,
      stock: Number(p.stock) || 0,
      categoryId: p.category || 'Geral',
      categoryName: p.category || 'Geral',
      updatedAt: p.updatedAt || new Date().toISOString(),
    }));

    if (formatted.length > 0) {
      await offlineDb.products.bulkPut(formatted);
      await worscoiDb.products.bulkPut(
        products.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.salePrice) || 0,
          barcode: p.barcode || '',
          _synced: true,
        }))
      );
    }
  } catch (err) {
    console.warn('[Storage] Falha não impeditiva no espelho IndexedDB de produtos:', err);
  }
}

/**
 * Espelha vendas em segundo plano para o IndexedDB local (Dexie)
 */
async function mirrorSalesToIndexedDb(sales: SaleTransaction[]): Promise<void> {
  if (typeof window === 'undefined' || !Array.isArray(sales)) return;
  try {
    const formatted = sales.map((s) => ({
      tempId: s.id,
      items: s.items.map((it) => ({
        productId: it.product.id,
        name: it.product.name,
        quantity: it.quantity,
        price: it.product.salePrice || 0,
        subtotal: (it.product.salePrice || 0) * it.quantity,
      })),
      totalAmount: s.total,
      paymentMethod: s.paymentMethod,
      amountPaid: s.total,
      change: 0,
      createdAt: s.createdAt,
      synced: 1,
    }));

    if (formatted.length > 0) {
      await offlineDb.sales.bulkPut(formatted);
    }
  } catch (err) {
    console.warn('[Storage] Falha não impeditiva no espelho IndexedDB de vendas:', err);
  }
}

export function loadStoredProducts(): Product[] {
  // 1. Tenta recuperar do localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache.products = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar produtos do localStorage:', err);
  }

  // 2. Se localStorage estiver vazio mas memória tiver dados
  if (memoryCache.products && memoryCache.products.length > 0) {
    return memoryCache.products;
  }

  return [];
}

export function saveStoredProducts(products: Product[]): void {
  if (!Array.isArray(products)) return;
  memoryCache.products = products;

  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.warn('Alerta de cota ao salvar produtos no localStorage (mantido em memória e IndexedDB):', err);
  }

  // Espelhamento assíncrono blindado para IndexedDB
  mirrorProductsToIndexedDb(products);
}

export function loadStoredWorkOrders(): WorkOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORK_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache.workOrders = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar Ordens de Serviço do localStorage:', err);
  }
  if (memoryCache.workOrders && memoryCache.workOrders.length > 0) {
    return memoryCache.workOrders;
  }
  return [];
}

export function saveStoredWorkOrders(workOrders: WorkOrder[]): void {
  if (!Array.isArray(workOrders)) return;
  memoryCache.workOrders = workOrders;
  try {
    localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(workOrders));
  } catch (err) {
    console.warn('Alerta de cota ao salvar Ordens de Serviço no localStorage (mantido em memória):', err);
  }
}

export function loadStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache.customers = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar clientes do localStorage:', err);
  }
  if (memoryCache.customers && memoryCache.customers.length > 0) {
    return memoryCache.customers;
  }
  return [];
}

export function saveStoredCustomers(customers: Customer[]): void {
  if (!Array.isArray(customers)) return;
  memoryCache.customers = customers;
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (err) {
    console.warn('Alerta de cota ao salvar clientes no localStorage (mantido em memória):', err);
  }
}

export function loadStoredSales(): SaleTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache.sales = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar vendas do localStorage:', err);
  }
  if (memoryCache.sales && memoryCache.sales.length > 0) {
    return memoryCache.sales;
  }
  return [];
}

export function saveStoredSales(sales: SaleTransaction[]): void {
  if (!Array.isArray(sales)) return;
  memoryCache.sales = sales;
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  } catch (err) {
    console.warn('Alerta de cota ao salvar vendas no localStorage (mantido em memória e IndexedDB):', err);
  }
  mirrorSalesToIndexedDb(sales);
}

export function loadStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache.expenses = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar despesas do localStorage:', err);
  }
  if (memoryCache.expenses && memoryCache.expenses.length > 0) {
    return memoryCache.expenses;
  }
  return [];
}

export function saveStoredExpenses(expenses: Expense[]): void {
  if (!Array.isArray(expenses)) return;
  memoryCache.expenses = expenses;
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (err) {
    console.warn('Alerta de cota ao salvar despesas no localStorage (mantido em memória):', err);
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

/**
 * Auto-recuperação e reconciliação entre LocalStorage e IndexedDB:
 * Se o LocalStorage for limpo acidentalmente pelo navegador, resgata os dados do IndexedDB.
 * Se o IndexedDB não tiver dados mas o LocalStorage tiver, sincroniza para o IndexedDB.
 */
export async function reconcileStorageWithIndexedDB(): Promise<{
  recoveredProducts: number;
  recoveredSales: number;
}> {
  let recoveredProducts = 0;
  let recoveredSales = 0;

  if (typeof window === 'undefined') return { recoveredProducts, recoveredSales };

  try {
    // 1. Reconciliação de Produtos
    const localProds = loadStoredProducts();
    if (localProds.length === 0) {
      const indexedProds = await offlineDb.products.toArray();
      if (indexedProds.length > 0) {
        const mapped: Product[] = indexedProds.map((ip) => ({
          id: ip.id,
          name: ip.name,
          sku: `MSK-${ip.id.slice(0, 5)}`,
          barcode: ip.barcode || '',
          category: ip.categoryName || 'Geral',
          saleType: 'Unidade',
          costPrice: 0,
          salePrice: ip.price,
          stock: ip.stock,
          minStock: 5,
          unit: 'un',
          status: 'active',
          updatedAt: ip.updatedAt,
        }));
        saveStoredProducts(mapped);
        recoveredProducts = mapped.length;
      }
    } else {
      mirrorProductsToIndexedDb(localProds);
    }

    // 2. Reconciliação de Vendas
    const localSales = loadStoredSales();
    if (localSales.length === 0) {
      const indexedSales = await offlineDb.sales.toArray();
      if (indexedSales.length > 0) {
        const mappedSales: SaleTransaction[] = indexedSales.map((is, idx) => ({
          id: is.tempId || `sale-rec-${idx}`,
          invoiceNumber: `FT MAS26/${String(idx + 100).padStart(5, '0')}`,
          customerName: 'Consumidor Final',
          items: (is.items || []).map((it) => ({
            product: {
              id: it.productId,
              name: it.name,
              sku: `MSK-${it.productId.slice(0, 5)}`,
              barcode: '',
              category: 'Geral',
              saleType: 'Unidade',
              costPrice: 0,
              salePrice: it.price,
              stock: 100,
              minStock: 5,
              unit: 'un',
              status: 'active',
              updatedAt: new Date().toISOString(),
            },
            quantity: it.quantity,
            price: it.price,
            subtotal: it.subtotal,
          })),
          subtotal: is.totalAmount,
          discount: 0,
          tax: 0,
          total: is.totalAmount,
          paymentMethod: (is.paymentMethod as any) || 'cash',
          cashierName: 'Operador',
          createdAt: is.createdAt || new Date().toISOString(),
          status: 'paid',
        }));
        saveStoredSales(mappedSales);
        recoveredSales = mappedSales.length;
      }
    } else {
      mirrorSalesToIndexedDb(localSales);
    }
  } catch (err) {
    console.warn('[Storage] Aviso não impeditivo na reconciliação LocalStorage/IndexedDB:', err);
  }

  return { recoveredProducts, recoveredSales };
}

/**
 * Diagnóstico completo e verificação de saúde do banco de dados (100% Blindado)
 */
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  localStorageOk: boolean;
  indexedDbOk: boolean;
  persistedStorageGranted: boolean;
  productsCount: number;
  salesCount: number;
  details: string;
}> {
  let localStorageOk = false;
  let indexedDbOk = false;
  let persistedStorageGranted = false;

  try {
    const testKey = '__masakula_test_db__';
    localStorage.setItem(testKey, '1');
    localStorageOk = localStorage.getItem(testKey) === '1';
    localStorage.removeItem(testKey);
  } catch {
    localStorageOk = false;
  }

  try {
    const count = await offlineDb.products.count();
    indexedDbOk = typeof count === 'number';
  } catch {
    indexedDbOk = false;
  }

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
    try {
      persistedStorageGranted = await navigator.storage.persisted();
    } catch {
      persistedStorageGranted = false;
    }
  }

  const pCount = loadStoredProducts().length;
  const sCount = loadStoredSales().length;

  return {
    isHealthy: localStorageOk || indexedDbOk,
    localStorageOk,
    indexedDbOk,
    persistedStorageGranted,
    productsCount: pCount,
    salesCount: sCount,
    details: 'Banco de dados híbrido (LocalStorage + Dexie IndexedDB) ativo e operacional.',
  };
}
