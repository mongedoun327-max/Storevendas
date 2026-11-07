import { supabase } from '../lib/supabase';
import { Product, WorkOrder, SaleTransaction, Expense, CashSession, CashMovement } from '../types';
import { 
  loadStoredProducts, 
  loadStoredWorkOrders, 
  loadStoredSales, 
  loadStoredExpenses, 
  loadStoredCashSession, 
  loadStoredCashMovements 
} from '../utils/storage';
import { addToSyncQueue } from './syncQueue';

export interface SupabaseProductRow {
  id?: string;
  barcode?: string;
  name: string;
  category?: string;
  sales_type?: string;
  cost?: string;
  price?: string;
  sku?: string;
  cost_price?: number;
  sale_price?: number;
  stock?: number;
  min_stock?: number;
  supplier?: string;
  batch?: string;
  expiration_date?: string;
  notes?: string;
  unit?: string;
  status?: string;
  created_at?: string;
}

export interface SupabaseServiceOrderRow {
  id?: string;
  code?: string;
  client?: string;
  customer_phone?: string;
  device_service?: string;
  status?: 'Pendente' | 'Em Andamento' | 'Concluído' | string;
  date?: string;
  total?: string;
  created_at?: string;
}

// Convert Supabase row to Product model
export function mapSupabaseToProduct(row: any): Product {
  const parseKz = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const cost = row.cost_price ?? parseKz(row.cost);
  const price = row.sale_price ?? parseKz(row.price);

  return {
    id: String(row.id || `prod-${Date.now()}`),
    name: row.name || 'Produto Sem Nome',
    sku: row.sku || `MSK-${row.id?.slice(0, 5) || Math.floor(1000 + Math.random() * 9000)}`,
    barcode: row.barcode || '',
    category: row.category || 'Alimentação',
    saleType: row.sales_type || row.saleType || 'Unidade',
    supplier: row.supplier || '',
    batch: row.batch || '',
    expirationDate: row.expiration_date || row.expiryDate || '',
    notes: row.notes || '',
    costPrice: cost,
    salePrice: price,
    stock: typeof row.stock === 'number' ? row.stock : 25,
    minStock: typeof row.min_stock === 'number' ? row.min_stock : 5,
    unit: row.unit || 'un',
    status: (row.status as any) || (cost > 0 && price > 0 ? 'active' : 'draft'),
    updatedAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

// Convert Product model to Supabase payload
export function mapProductToSupabase(p: Partial<Product>): SupabaseProductRow {
  return {
    barcode: p.barcode || '',
    name: p.name || '',
    category: p.category || 'Alimentação',
    sales_type: p.saleType || 'Unidade',
    cost: `${p.costPrice || 0} Kz`,
    price: `${p.salePrice || 0} Kz`,
    cost_price: p.costPrice || 0,
    sale_price: p.salePrice || 0,
    stock: p.stock ?? 25,
    min_stock: p.minStock ?? 5,
    supplier: p.supplier || '',
    batch: p.batch || '',
    expiration_date: p.expirationDate || '',
    notes: p.notes || '',
    sku: p.sku || `MSK-${Math.floor(1000 + Math.random() * 9000)}`,
    unit: p.unit || 'un',
    status: p.status || 'active',
  };
}

// Convert Supabase row to WorkOrder model
export function mapSupabaseToWorkOrder(row: any): WorkOrder {
  const parseKz = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const total = parseKz(row.total);
  const statusMap: Record<string, 'pending' | 'in_progress' | 'completed'> = {
    'Pendente': 'pending',
    'Em Andamento': 'in_progress',
    'Concluído': 'completed',
    'pending': 'pending',
    'in_progress': 'in_progress',
    'completed': 'completed',
  };

  return {
    id: String(row.id || `os-${Date.now()}`),
    code: row.code || `OS-2026-${Math.floor(100 + Math.random() * 900)}`,
    customerName: row.client || row.customerName || 'Cliente Particular',
    customerPhone: row.customer_phone || row.customerPhone || '+244 923 000 000',
    equipment: row.device_service || row.equipment || 'Equipamento em Reparação',
    reportedDefect: row.reportedDefect || row.device_service || 'Anomalia técnica',
    technician: row.technician || 'Técnico Especialista',
    status: statusMap[row.status] || 'in_progress',
    priority: row.priority || 'normal',
    partsCost: total > 0 ? Math.round(total * 0.4) : 0,
    laborCost: total > 0 ? Math.round(total * 0.6) : 0,
    totalCost: total,
    createdAt: row.date || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    estimatedDelivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
  };
}

// Convert WorkOrder model to Supabase payload
export function mapWorkOrderToSupabase(wo: Partial<WorkOrder>): SupabaseServiceOrderRow {
  const statusDisplay = 
    wo.status === 'completed' || wo.status === 'delivered' ? 'Concluído' :
    wo.status === 'in_progress' || wo.status === 'diagnosing' || wo.status === 'waiting_parts' ? 'Em Andamento' :
    'Pendente';

  return {
    code: wo.code || `OS-2026-${Math.floor(100 + Math.random() * 900)}`,
    client: wo.customerName || 'Cliente Particular',
    customer_phone: wo.customerPhone || '',
    device_service: `${wo.equipment || 'Equipamento'} - ${wo.reportedDefect || 'Serviço'}`,
    status: statusDisplay,
    date: wo.createdAt || new Date().toISOString().split('T')[0],
    total: `${wo.totalCost || 0} Kz`,
  };
}

// Supabase API Operations with resilient Fallback
export const supabaseService = {
  async getProducts(): Promise<{ data: Product[]; fromSupabase: boolean }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return { data: data.map(mapSupabaseToProduct), fromSupabase: true };
      }
    } catch (err) {
      console.warn('Supabase fetch products notice (using local data):', err);
    }
    return { data: loadStoredProducts(), fromSupabase: false };
  },

  async insertProduct(product: Partial<Product>, skipQueue: boolean = false): Promise<{ success: boolean; data?: Product; error?: any }> {
    const payload = mapProductToSupabase(product);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        return { success: true, data: mapSupabaseToProduct(data[0]) };
      }
      if (error) {
        console.warn('Supabase insert warning:', error.message);
      }
    } catch (err) {
      console.warn('Supabase insert exception:', err);
    }

    // Offline / Network fallback: automatically add to offline sync queue
    if (!skipQueue) {
      addToSyncQueue({
        type: 'PRODUCT_UPSERT',
        payload: product,
      });
    }

    const localProduct = mapSupabaseToProduct({ ...payload, id: product.id || `prod-${Date.now()}` });
    return { success: false, data: localProduct };
  },

  async deleteProduct(id: string, skipQueue: boolean = false): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase delete product notice:', err);
    }

    if (!skipQueue) {
      addToSyncQueue({
        type: 'PRODUCT_DELETE',
        payload: { id },
      });
    }
    return false;
  },

  async getServiceOrders(): Promise<{ data: WorkOrder[]; fromSupabase: boolean }> {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return { data: data.map(mapSupabaseToWorkOrder), fromSupabase: true };
      }
    } catch (err) {
      console.warn('Supabase fetch service orders notice (using local data):', err);
    }
    return { data: loadStoredWorkOrders(), fromSupabase: false };
  },

  async insertServiceOrder(order: Partial<WorkOrder>, skipQueue: boolean = false): Promise<{ success: boolean; data?: WorkOrder }> {
    const payload = mapWorkOrderToSupabase(order);
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        return { success: true, data: mapSupabaseToWorkOrder(data[0]) };
      }
    } catch (err) {
      console.warn('Supabase insert service order notice:', err);
    }

    if (!skipQueue) {
      addToSyncQueue({
        type: 'WORK_ORDER_UPSERT',
        payload: order,
      });
    }

    const localOrder = mapSupabaseToWorkOrder({ ...payload, id: order.id || `os-${Date.now()}` });
    return { success: false, data: localOrder };
  },

  async getSales(): Promise<{ data: SaleTransaction[]; fromSupabase: boolean }> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          data: data.map((row: any) => ({
            id: String(row.id || `sale-${Date.now()}`),
            invoiceNumber: row.invoice_number || row.invoiceNumber || `FT MAS26/${Math.floor(1000 + Math.random() * 9000)}`,
            customerName: row.customer_name || row.customerName || 'Consumidor Final',
            customerNif: row.customer_nif || row.customerNif || undefined,
            items: Array.isArray(row.items) ? row.items : [],
            subtotal: typeof row.subtotal === 'number' ? row.subtotal : parseFloat(String(row.subtotal).replace(/[^0-9.]/g, '')) || 0,
            discount: typeof row.discount === 'number' ? row.discount : 0,
            tax: typeof row.tax === 'number' ? row.tax : 0,
            total: typeof row.total === 'number' ? row.total : parseFloat(String(row.total).replace(/[^0-9.]/g, '')) || 0,
            paymentMethod: row.payment_method || row.paymentMethod || 'cash',
            cashierName: row.cashier_name || row.cashierName || 'Operador de Caixa',
            createdAt: row.created_at || new Date().toISOString(),
            status: row.status || 'paid',
          })),
          fromSupabase: true
        };
      }
    } catch (err) {
      console.warn('Supabase fetch sales notice (using local data):', err);
    }
    return { data: loadStoredSales(), fromSupabase: false };
  },

  async insertSale(sale: SaleTransaction, additionalInfo?: { amountPaid?: number; changeGiven?: number }, skipQueue: boolean = false): Promise<{ success: boolean; data?: SaleTransaction }> {
    try {
      const paid = additionalInfo?.amountPaid ?? sale.total;
      const change = additionalInfo?.changeGiven ?? Math.max(0, paid - sale.total);

      const payload = {
        invoice_number: sale.invoiceNumber,
        customer_name: sale.customerName,
        customer_nif: sale.customerNif || null,
        items: sale.items,
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
        total: `${sale.total} Kz`,
        payment_method: sale.paymentMethod === 'cash' ? 'Dinheiro' : sale.paymentMethod === 'multicaixa' ? 'TPA / Multicaixa' : sale.paymentMethod,
        cashier_name: sale.cashierName,
        status: sale.status,
        amount_paid: `${paid} Kz`,
        change_given: `${change} Kz`,
        created_at: sale.createdAt,
      };

      const { data, error } = await supabase
        .from('sales')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        const saleRecord = data[0];
        try {
          const saleItems = sale.items.map((item) => ({
            sale_id: saleRecord.id || sale.id,
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: `${item.product.salePrice} Kz`,
            subtotal: `${item.product.salePrice * item.quantity} Kz`,
          }));
          await supabase.from('sale_items').insert(saleItems);
        } catch {
          // Non-blocking if sale_items doesn't exist
        }

        return { success: true, data: sale };
      }
    } catch (err) {
      console.warn('Supabase insert sale notice:', err);
    }

    if (!skipQueue) {
      addToSyncQueue({
        type: 'SALE_INSERT',
        payload: { sale, additionalInfo },
      });
    }

    return { success: false, data: sale };
  },

  async cancelOrRefundSale(
    saleId: string,
    items: { productId: string; quantity: number }[],
    reason: string = 'Estorno de venda autorizado pelo Gerente',
    skipQueue: boolean = false
  ): Promise<{ success: boolean }> {
    try {
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          status: 'CANCELED',
          notes: reason
        })
        .or(`id.eq.${saleId},invoice_number.eq.${saleId}`);

      for (const item of items) {
        try {
          const { data: prodData } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.productId)
            .single();

          if (prodData && typeof prodData.stock === 'number') {
            const returnedStock = prodData.stock + item.quantity;
            await supabase
              .from('products')
              .update({
                stock: returnedStock,
                status: returnedStock <= 0 ? 'out_of_stock' : returnedStock <= 5 ? 'low_stock' : 'active'
              })
              .eq('id', item.productId);
          }
        } catch (itemErr) {
          console.warn('Erro ao repor estoque no Supabase:', itemErr);
        }
      }

      if (!saleError) return { success: true };
    } catch (err) {
      console.warn('Supabase cancel sale notice:', err);
    }

    if (!skipQueue) {
      addToSyncQueue({
        type: 'SALE_CANCEL',
        payload: { saleId, items, reason },
      });
    }

    return { success: false };
  },

  async updateProductStock(productId: string, newStock: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          stock: newStock,
          status: newStock === 0 ? 'out_of_stock' : newStock <= 5 ? 'low_stock' : 'active'
        })
        .eq('id', productId);
      return !error;
    } catch (err) {
      console.warn('Supabase update stock notice:', err);
      return false;
    }
  },

  async getExpenses(): Promise<{ data: Expense[]; fromSupabase: boolean }> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('due_date', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          data: data.map((row: any) => ({
            id: String(row.id),
            description: row.description || '',
            category: row.category || 'Operacional',
            amount: typeof row.amount === 'number' ? row.amount : parseFloat(String(row.amount).replace(/[^0-9.]/g, '')) || 0,
            due_date: row.due_date || new Date().toISOString().split('T')[0],
            payment_date: row.payment_date || null,
            status: row.status || 'PENDING',
            supplier: row.supplier || '',
            payment_method: row.payment_method || 'Multicaixa',
            notes: row.notes || ''
          })),
          fromSupabase: true
        };
      }
    } catch (err) {
      console.warn('Supabase fetch expenses notice (using local data):', err);
    }
    return { data: loadStoredExpenses(), fromSupabase: false };
  },

  async insertExpense(expense: Expense, skipQueue: boolean = false): Promise<{ success: boolean; data?: Expense }> {
    try {
      const payload = {
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        due_date: expense.due_date,
        payment_date: expense.payment_date || null,
        status: expense.status,
        supplier: expense.supplier || null,
        payment_method: expense.payment_method || 'Multicaixa',
        notes: expense.notes || null,
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        return { success: true, data: { ...expense, id: String(data[0].id) } };
      }
    } catch (err) {
      console.warn('Supabase insert expense notice:', err);
    }

    if (!skipQueue) {
      addToSyncQueue({
        type: 'EXPENSE_UPSERT',
        payload: expense,
      });
    }

    return { success: false, data: { ...expense, id: expense.id || `exp-${Date.now()}` } };
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id);
      return !error;
    } catch (err) {
      console.warn('Supabase update expense notice:', err);
      return false;
    }
  },

  async deleteExpense(id: string, skipQueue: boolean = false): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase delete expense notice:', err);
    }

    if (!skipQueue) {
      addToSyncQueue({
        type: 'EXPENSE_DELETE',
        payload: { id },
      });
    }
    return false;
  },

  async getActiveCashSession(): Promise<{ data: CashSession | null; fromSupabase: boolean }> {
    try {
      const { data, error } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('status', 'OPEN')
        .order('opened_at', { ascending: false })
        .maybeSingle();

      if (!error && data) {
        return {
          data: {
            id: String(data.id),
            operator_name: data.operator_name || 'Operador',
            opened_at: data.opened_at || new Date().toISOString(),
            closed_at: data.closed_at || null,
            initial_amount: typeof data.initial_amount === 'number' ? data.initial_amount : parseFloat(data.initial_amount) || 0,
            actual_cash: data.actual_cash !== null && data.actual_cash !== undefined ? Number(data.actual_cash) : null,
            expected_cash: typeof data.expected_cash === 'number' ? data.expected_cash : parseFloat(data.expected_cash) || 0,
            difference: data.difference !== null && data.difference !== undefined ? Number(data.difference) : null,
            status: data.status || 'OPEN',
            notes: data.notes || null,
          },
          fromSupabase: true
        };
      }
    } catch (err) {
      console.warn('Supabase getActiveCashSession notice (using local fallback):', err);
    }
    return { data: loadStoredCashSession(), fromSupabase: false };
  },

  async getCashMovements(sessionId: string): Promise<{ data: CashMovement[]; fromSupabase: boolean }> {
    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          data: data.map((m: any) => ({
            id: String(m.id),
            session_id: String(m.session_id),
            type: m.type as 'SUPRIMENTO' | 'SANGRIA',
            amount: typeof m.amount === 'number' ? m.amount : parseFloat(m.amount) || 0,
            reason: m.reason || '',
            created_at: m.created_at || new Date().toISOString(),
          })),
          fromSupabase: true
        };
      }
    } catch (err) {
      console.warn('Supabase getCashMovements notice:', err);
    }
    return { data: loadStoredCashMovements().filter(m => m.session_id === sessionId), fromSupabase: false };
  },

  async openCashSession(payload: { operator_name: string; initial_amount: number }, skipQueue: boolean = false): Promise<CashSession> {
    const sessionToCreate: CashSession = {
      id: `cs-${Date.now()}`,
      operator_name: payload.operator_name,
      opened_at: new Date().toISOString(),
      closed_at: null,
      initial_amount: payload.initial_amount,
      expected_cash: payload.initial_amount,
      actual_cash: null,
      difference: null,
      status: 'OPEN',
      notes: null,
    };

    try {
      const { data, error } = await supabase
        .from('cash_sessions')
        .insert([{
          operator_name: sessionToCreate.operator_name,
          initial_amount: sessionToCreate.initial_amount,
          expected_cash: sessionToCreate.expected_cash,
          status: 'OPEN',
          opened_at: sessionToCreate.opened_at,
        }])
        .select()
        .single();

      if (!error && data) {
        return {
          ...sessionToCreate,
          id: String(data.id),
        };
      }
    } catch (err) {
      console.warn('Supabase openCashSession notice:', err);
    }

    if (!skipQueue) {
      addToSyncQueue({
        type: 'CASH_SESSION_OPEN',
        payload,
      });
    }

    return sessionToCreate;
  },

  async insertCashMovement(movement: CashMovement, skipQueue: boolean = false): Promise<CashMovement> {
    const newMovement: CashMovement = {
      ...movement,
      id: movement.id || `mov-${Date.now()}`,
      created_at: movement.created_at || new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .insert([{
          session_id: newMovement.session_id,
          type: newMovement.type,
          amount: newMovement.amount,
          reason: newMovement.reason,
        }])
        .select()
        .single();

      if (!error && data) {
        return {
          ...newMovement,
          id: String(data.id),
        };
      }
    } catch (err) {
      console.warn('Supabase insertCashMovement notice:', err);
    }

    if (!skipQueue) {
      addToSyncQueue({
        type: 'CASH_MOVEMENT',
        payload: movement,
      });
    }

    return newMovement;
  },

  async updateCashSessionExpected(sessionId: string, newExpected: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cash_sessions')
        .update({ expected_cash: newExpected })
        .eq('id', sessionId);
      return !error;
    } catch (err) {
      console.warn('Supabase updateCashSessionExpected notice:', err);
      return false;
    }
  },

  async closeCashSession(sessionId: string, actualCash: number, difference: number, skipQueue: boolean = false): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cash_sessions')
        .update({
          actual_cash: actualCash,
          difference: difference,
          status: 'CLOSED',
          closed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase closeCashSession notice:', err);
    }

    if (!skipQueue) {
      addToSyncQueue({
        type: 'CASH_SESSION_CLOSE',
        payload: { sessionId, actualCash, difference },
      });
    }

    return false;
  },

  async approveStockAudit(auditId: string, userId?: string): Promise<{ data: any | null; error: Error | null; success: boolean }> {
    try {
      let effectiveUserId = userId;
      if (!effectiveUserId) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          effectiveUserId = userData.user?.id || '00000000-0000-0000-0000-000000000000';
        } catch {
          effectiveUserId = '00000000-0000-0000-0000-000000000000';
        }
      }

      const { data, error } = await supabase.rpc('approve_stock_audit', {
        p_audit_id: auditId,
        p_user_id: effectiveUserId,
      });

      if (error) {
        console.error('Erro na aprovação da auditoria de estoque:', error.message);
        return { data: null, error: new Error(error.message), success: false };
      }

      console.log('Auditoria regularizada com sucesso:', data);
      return { data, error: null, success: true };
    } catch (err: any) {
      console.error('Falha inesperada ao executar approve_stock_audit:', err);
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
        success: false,
      };
    }
  },

  async getMonthlyBreakageSummaryByReason(storeId?: string, periodMonth?: string) {
    try {
      const defaultMonth = new Date().toISOString().slice(0, 7) + '-01';
      const period = periodMonth || defaultMonth;

      let query = supabase
        .from('v_monthly_breakage_summary_by_reason')
        .select('*')
        .order('total_amount_lost', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (period) {
        query = query.eq('period_month', period);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao consultar v_monthly_breakage_summary_by_reason:', error.message);
        return { data: null, error: new Error(error.message), success: false };
      }

      return { data, error: null, success: true };
    } catch (err: any) {
      console.error('Falha inesperada ao obter resumo de quebras por motivo:', err);
      return {
        data: null,
        error: err instanceof Error ? err : new Error(String(err)),
        success: false,
      };
    }
  },
};
