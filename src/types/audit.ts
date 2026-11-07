export type DivergenceReason =
  | "damaged"
  | "expired"
  | "stolen"
  | "misplaced"
  | "system_error"
  | "untracked_use"
  | "other";

export interface BreakageReasonSummary {
  period_month: string;
  store_id: string;
  divergence_reason: DivergenceReason;
  distinct_products_affected: number;
  total_qty_lost: number;
  total_amount_lost: number;
  percentage_of_monthly_loss: number;
}

export const REASON_CONFIG: Record<DivergenceReason, { label: string; color: string }> = {
  damaged: { label: "Danificado / Avaria", color: "#f43f5e" },       // Rose 500
  expired: { label: "Validade Expirada", color: "#eab308" },       // Yellow 500
  stolen: { label: "Furto / Roubo", color: "#a855f7" },             // Purple 500
  misplaced: { label: "Extravio", color: "#06b6d4" },              // Cyan 500
  system_error: { label: "Erro de Sistema", color: "#3b82f6" },     // Blue 500
  untracked_use: { label: "Uso Interno", color: "#32D583" },        // Emerald / Mint
  other: { label: "Outros Motivos", color: "#6b7280" },             // Gray 500
};

export interface StockAuditItem {
  id: string;
  audit_id: string;
  product_id: string;
  product_name?: string;
  barcode?: string;
  expected_qty: number;
  counted_qty: number;
  divergence_qty: number;
  divergence_reason: DivergenceReason;
  unit_cost: number;
  total_divergence_value: number;
  notes?: string;
}

export interface StockAudit {
  id: string;
  store_id: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'regularized';
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  items?: StockAuditItem[];
}
