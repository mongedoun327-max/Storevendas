import { supabase } from '../lib/supabase';
import { DivergenceReason, BreakageReasonSummary, REASON_CONFIG } from '../types/cash';

export type { DivergenceReason, BreakageReasonSummary };
export { REASON_CONFIG };

export const DIVERGENCE_REASON_LABELS: Record<DivergenceReason, string> = {
  damaged: REASON_CONFIG.damaged.label,
  expired: REASON_CONFIG.expired.label,
  stolen: REASON_CONFIG.stolen.label,
  misplaced: REASON_CONFIG.misplaced.label,
  system_error: REASON_CONFIG.system_error.label,
  untracked_use: REASON_CONFIG.untracked_use.label,
  other: REASON_CONFIG.other.label,
};


export type MonthlyBreakageSummaryByReason = BreakageReasonSummary;

export interface GetBreakageSummaryParams {
  storeId?: string;
  periodMonth?: string;
}

export interface BreakageSummaryResult {
  data: BreakageReasonSummary[] | null;
  error: Error | null;
  success: boolean;
}

/**
 * Fetches monthly breakage summary grouped by reason from Supabase view `v_monthly_breakage_summary_by_reason`.
 *
 * @param params Query filters including storeId and periodMonth (defaults to current month YYYY-MM-01)
 * @returns Array of summary items sorted by total_amount_lost descending
 *
 * @example
 * const { data, error } = await getBreakageSummaryByReason({
 *   storeId: 'store_123',
 *   periodMonth: '2026-09-01'
 * });
 */
export async function getBreakageSummaryByReason(
  params: GetBreakageSummaryParams = {}
): Promise<BreakageSummaryResult> {
  try {
    const defaultMonth = new Date().toISOString().slice(0, 7) + '-01';
    const periodMonth = params.periodMonth || defaultMonth;

    let query = supabase
      .from('v_monthly_breakage_summary_by_reason')
      .select('*')
      .order('total_amount_lost', { ascending: false });

    if (params.storeId) {
      query = query.eq('store_id', params.storeId);
    }

    if (periodMonth) {
      query = query.eq('period_month', periodMonth);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao consultar v_monthly_breakage_summary_by_reason:', error.message);
      return { data: null, error: new Error(error.message), success: false };
    }

    return { data: data as MonthlyBreakageSummaryByReason[], error: null, success: true };
  } catch (err: any) {
    console.error('Falha inesperada ao obter resumo de quebras por motivo:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
      success: false,
    };
  }
}

export default getBreakageSummaryByReason;
