import { useState, useEffect, useCallback } from 'react';
import {
  getBreakageSummaryByReason,
  BreakageReasonSummary,
  DivergenceReason,
  DIVERGENCE_REASON_LABELS,
  REASON_CONFIG,
} from '../services/breakageService';

export type { BreakageReasonSummary, DivergenceReason };
export { REASON_CONFIG, DIVERGENCE_REASON_LABELS };


export interface UseBreakageSummaryOptions {
  storeId?: string;
  periodMonth?: string;
  enabled?: boolean;
}

export function useBreakageSummary(options: UseBreakageSummaryOptions = {}) {
  const { storeId, periodMonth, enabled = true } = options;
  const [data, setData] = useState<BreakageReasonSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    const result = await getBreakageSummaryByReason({ storeId, periodMonth });

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [storeId, periodMonth, enabled]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    data,
    loading,
    error,
    refetch: fetchSummary,
    totalLoss: data.reduce((acc, item) => acc + (Number(item.total_amount_lost) || 0), 0),
  };
}

export default useBreakageSummary;
