import { supabase } from '../lib/supabase';
import { supabaseService } from './supabaseService';
import { 
  getSyncQueue, 
  removeSyncQueueItem, 
  updateSyncQueueItem, 
  SyncQueueItem,
  getSyncQueueCount,
  subscribeToSyncQueue
} from './syncQueue';
import { 
  loadStoredProducts, 
  saveStoredProducts, 
  loadStoredSales, 
  saveStoredSales, 
  loadStoredExpenses, 
  saveStoredExpenses, 
  loadStoredWorkOrders, 
  saveStoredWorkOrders, 
  loadStoredCashSession, 
  saveStoredCashSession,
  loadStoredCustomers,
  saveStoredCustomers
} from '../utils/storage';
import { Product, SaleTransaction, Expense, WorkOrder, CashSession, Customer } from '../types';

export const SYNC_COMPLETE_EVENT = 'masakula:remote-sync-complete';
const LAST_SYNC_KEY = 'masakula_last_sync_timestamp';

export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

export function setLastSyncTime(timestamp: string): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  } catch {
    // ignore
  }
}

export async function isNetworkOnline(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  // Fast lightweight ping to Supabase to verify real reachability
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

let isProcessingQueue = false;

/**
 * Process all operations queued while offline
 */
export async function processSyncQueue(): Promise<{ processed: number; failed: number }> {
  if (isProcessingQueue) return { processed: 0, failed: 0 };
  isProcessingQueue = true;

  const queue = getSyncQueue();
  let processed = 0;
  let failed = 0;

  try {
    for (const item of queue) {
      let success = false;

      try {
        switch (item.type) {
          case 'PRODUCT_UPSERT': {
            const res = await supabaseService.insertProduct(item.payload, true); // true = skipQueue
            success = res.success;
            break;
          }
          case 'PRODUCT_DELETE': {
            success = await supabaseService.deleteProduct(item.payload.id, true);
            break;
          }
          case 'SALE_INSERT': {
            const res = await supabaseService.insertSale(item.payload.sale, item.payload.additionalInfo, true);
            success = res.success;
            break;
          }
          case 'SALE_CANCEL': {
            const res = await supabaseService.cancelOrRefundSale(
              item.payload.saleId,
              item.payload.items,
              item.payload.reason,
              true
            );
            success = res.success;
            break;
          }
          case 'EXPENSE_UPSERT': {
            const res = await supabaseService.insertExpense(item.payload, true);
            success = res.success;
            break;
          }
          case 'EXPENSE_DELETE': {
            success = await supabaseService.deleteExpense(item.payload.id, true);
            break;
          }
          case 'WORK_ORDER_UPSERT': {
            const res = await supabaseService.insertServiceOrder(item.payload, true);
            success = res.success;
            break;
          }
          case 'CASH_SESSION_OPEN': {
            const res = await supabaseService.openCashSession(item.payload, true);
            success = !!res && res.id !== item.payload.id;
            break;
          }
          case 'CASH_SESSION_CLOSE': {
            success = await supabaseService.closeCashSession(
              item.payload.sessionId,
              item.payload.actualCash,
              item.payload.difference,
              true
            );
            break;
          }
          case 'CASH_MOVEMENT': {
            const res = await supabaseService.insertCashMovement(item.payload, true);
            success = !!res;
            break;
          }
        }
      } catch (err: any) {
        console.warn(`Sync failed for item ${item.id}:`, err);
        success = false;
      }

      if (success) {
        removeSyncQueueItem(item.id);
        processed++;
      } else {
        const attempts = (item.attempts || 0) + 1;
        if (attempts > 5) {
          // Drop permanently corrupted item to avoid infinite blocking
          removeSyncQueueItem(item.id);
        } else {
          updateSyncQueueItem(item.id, { attempts, lastError: 'Falha de conexão com o servidor' });
        }
        failed++;
      }
    }
  } finally {
    isProcessingQueue = false;
  }

  return { processed, failed };
}

/**
 * Full Bidirectional Synchronization
 * 1. Flushes pending offline operations to Supabase
 * 2. Fetches latest remote data from Supabase (from other users/terminals)
 * 3. Merges remote data with local storage
 * 4. Dispatches event to update all active views
 */
export async function syncAllWithSupabase(): Promise<{
  success: boolean;
  syncedProducts: number;
  syncedSales: number;
  syncedOrders: number;
  syncedExpenses: number;
  queueProcessed: number;
  message: string;
}> {
  const online = await isNetworkOnline();
  if (!online) {
    return {
      success: false,
      syncedProducts: 0,
      syncedSales: 0,
      syncedOrders: 0,
      syncedExpenses: 0,
      queueProcessed: 0,
      message: 'Sem ligação à internet. Todas as alterações continuam seguras offline localmente.',
    };
  }

  // 1. Process Offline Sync Queue first
  const { processed } = await processSyncQueue();

  // 2. Fetch remote collections from Supabase
  try {
    const [prodRes, salesRes, ordersRes, expRes, cashRes] = await Promise.all([
      supabaseService.getProducts(),
      supabaseService.getSales(),
      supabaseService.getServiceOrders(),
      supabaseService.getExpenses(),
      supabaseService.getActiveCashSession(),
    ]);

    let mergedProducts = loadStoredProducts();
    let mergedSales = loadStoredSales();
    let mergedOrders = loadStoredWorkOrders();
    let mergedExpenses = loadStoredExpenses();
    let mergedCashSession = loadStoredCashSession();

    // Smart merge products: combine local and remote, favoring newest or remote if existing
    if (prodRes.fromSupabase && prodRes.data.length > 0) {
      const prodMap = new Map<string, Product>();
      mergedProducts.forEach(p => prodMap.set(p.id, p));
      prodRes.data.forEach(p => prodMap.set(p.id, p));
      mergedProducts = Array.from(prodMap.values());
      saveStoredProducts(mergedProducts);
    }

    // Smart merge sales
    if (salesRes.fromSupabase && salesRes.data.length > 0) {
      const saleMap = new Map<string, SaleTransaction>();
      mergedSales.forEach(s => saleMap.set(s.id, s));
      salesRes.data.forEach(s => saleMap.set(s.id, s));
      mergedSales = Array.from(saleMap.values()).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveStoredSales(mergedSales);
    }

    // Smart merge service orders
    if (ordersRes.fromSupabase && ordersRes.data.length > 0) {
      const orderMap = new Map<string, WorkOrder>();
      mergedOrders.forEach(o => orderMap.set(o.id, o));
      ordersRes.data.forEach(o => orderMap.set(o.id, o));
      mergedOrders = Array.from(orderMap.values());
      saveStoredWorkOrders(mergedOrders);
    }

    // Smart merge expenses
    if (expRes.fromSupabase && expRes.data.length > 0) {
      const expMap = new Map<string, Expense>();
      mergedExpenses.forEach(e => {
        const key = e.id || `${e.description}-${e.due_date}`;
        expMap.set(key, e);
      });
      expRes.data.forEach(e => {
        const key = e.id || `${e.description}-${e.due_date}`;
        expMap.set(key, e);
      });
      mergedExpenses = Array.from(expMap.values());
      saveStoredExpenses(mergedExpenses);
    }

    // Cash session sync
    if (cashRes.fromSupabase && cashRes.data) {
      mergedCashSession = cashRes.data;
      saveStoredCashSession(mergedCashSession);
    }

    const now = new Date().toISOString();
    setLastSyncTime(now);

    // Notify all app components that remote sync completed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYNC_COMPLETE_EVENT, {
        detail: {
          products: mergedProducts,
          sales: mergedSales,
          workOrders: mergedOrders,
          expenses: mergedExpenses,
          cashSession: mergedCashSession,
          timestamp: now,
        }
      }));
    }

    return {
      success: true,
      syncedProducts: mergedProducts.length,
      syncedSales: mergedSales.length,
      syncedOrders: mergedOrders.length,
      syncedExpenses: mergedExpenses.length,
      queueProcessed: processed,
      message: 'Sincronização com o servidor concluída com sucesso em tempo real.',
    };
  } catch (err: any) {
    console.error('Erro durante sincronização com Supabase:', err);
    return {
      success: false,
      syncedProducts: 0,
      syncedSales: 0,
      syncedOrders: 0,
      syncedExpenses: 0,
      queueProcessed: processed,
      message: 'Falha temporária ao sincronizar com o servidor. Dados preservados offline.',
    };
  }
}
