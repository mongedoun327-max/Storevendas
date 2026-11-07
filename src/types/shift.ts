export * from './cash';

export type PaymentMethod = "Numerário" | "Multicaixa" | "Transferência";

export interface PaymentBreakdown {
	numerario: number;
	multicaixa: number;
	transferencia: number;
	total: number;
}

export interface ShiftSummary {
	shiftId: string;
	operatorName: string;
	openedAt: string;
	closedAt: string;
	openingFloat: number;
	salesCount: number;
	expectedAmounts: PaymentBreakdown;
	declaredAmounts: PaymentBreakdown;
	discrepancies: PaymentBreakdown;
}
