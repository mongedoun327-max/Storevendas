import { createClient } from "@/lib/supabase/client";
import type { PaymentBreakdown, ShiftSummary } from "@/types/shift";

export async function calculateShiftSummary(
  shiftId: string,
  operatorName: string,
  openedAt: string,
  openingFloat: number,
  declared: PaymentBreakdown
): Promise<ShiftSummary> {
  const supabase = createClient();
  const { data: sales, error } = await supabase
    .from("sales")
    .select("payment_method, total_amount")
    .eq("shift_id", shiftId)
    .eq("status", "completed");

  if (error) throw error;

  const expected: PaymentBreakdown = {
    numerario: 0,
    multicaixa: 0,
    transferencia: 0,
    total: 0,
  };

  (sales ?? []).forEach((sale) => {
    const amount = Number(sale.total_amount) || 0;
    if (sale.payment_method === "Numerário") {
      expected.numerario += amount;
    } else if (sale.payment_method === "Multicaixa") {
      expected.multicaixa += amount;
    } else if (sale.payment_method === "Transferência") {
      expected.transferencia += amount;
    }
  });

  expected.total = expected.numerario + expected.multicaixa + expected.transferencia;
  const expectedCashInDrawer = expected.numerario + openingFloat;

  const discrepancies: PaymentBreakdown = {
    numerario: declared.numerario - expectedCashInDrawer,
    multicaixa: declared.multicaixa - expected.multicaixa,
    transferencia: declared.transferencia - expected.transferencia,
    total:
      declared.numerario
      + declared.multicaixa
      + declared.transferencia
      - (expected.total + openingFloat),
  };

  return {
    shiftId,
    operatorName,
    openedAt,
    closedAt: new Date().toISOString(),
    openingFloat,
    salesCount: sales?.length ?? 0,
    expectedAmounts: {
      ...expected,
      numerario: expectedCashInDrawer,
    },
    declaredAmounts: declared,
    discrepancies,
  };
}
