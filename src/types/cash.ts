export type MovementType = "SANGRIA" | "REFORCO";

export interface CashMovement {
  id: string;
  type: MovementType;
  amount: number;
  reason: string;
  timestamp: string;
  operatorName: string;
}

export interface ShiftRecord {
  id: string;
  operatorName: string;
  terminalId: string;
  openedAt: string;
  closedAt: string | null;
  status: "OPEN" | "CLOSED";
  initialCash: number;
  salesCash: number;
  salesCard: number; // Multicaixa / TPA
  totalSangria: number;
  totalReforco: number;
  expectedCash: number;
  actualCash: number | null;
  difference: number | null; // Quebra (negativo) ou Sobra (positivo)
  movements: CashMovement[];
}

export interface OperatorPerformance {
  operatorId: string;
  operatorName: string;
  totalShifts: number;
  totalSalesCash: number;
  totalSalesCard: number;
  totalSales: number;
  totalBreakage: number; // Valor acumulado de quebras (negativo)
  totalSurplus: number;  // Valor acumulado de sobras (positivo)
  netDifference: number; // Diferença líquida
  accuracyRate: number;  // Taxa de precisão (%)
}

export interface BreakageTrendPoint {
  date: string;
  [operatorName: string]: number | string; // Dinâmico por operador para gráfico multilinhas
}

export type { DivergenceReason, BreakageReasonSummary } from './audit';
export { REASON_CONFIG } from './audit';

