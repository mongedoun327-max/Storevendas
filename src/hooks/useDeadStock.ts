import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface DeadStockItem {
  product_id: string;
  product_name: string;
  barcode: string;
  stock_quantity: number;
  cost_price: number;
  sale_price: number;
  capital_locked: number;
  last_activity_date: string;
  days_inactive: number;
  suggested_action: 'LIQUIDATION' | 'COMBO' | 'DISCOUNT_15';
}

const FALLBACK_DEAD_STOCK: DeadStockItem[] = [];

export function useDeadStock() {
  const [items, setItems] = useState<DeadStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeadStock = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('view_dead_stock_analysis')
        .select('*');

      if (!error && data && data.length > 0) {
        setItems(data as DeadStockItem[]);
      } else {
        setItems(FALLBACK_DEAD_STOCK);
      }
    } catch (err) {
      console.warn('Usando dados de estoque de segurança locais:', err);
      setItems(FALLBACK_DEAD_STOCK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadStock();
  }, []);

  const totalCapitalLocked = items.reduce((sum, item) => sum + (item.capital_locked || 0), 0);

  return { items, totalCapitalLocked, loading, refresh: fetchDeadStock };
}
