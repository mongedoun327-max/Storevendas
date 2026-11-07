import { createClient } from "@/lib/supabase/client";

export type MovementType = "sangria" | "suprimento";

export interface CashMovementInput {
  shiftId: string;
  type: MovementType;
  amount: number;
  reason: string;
}

export interface CloseShiftPayload {
  shiftId: string;
  declaredCash: number;
  declaredMulticaixa: number;
  declaredTransfer: number;
  notes?: string;
}

/** Regista uma sangria ou suprimento no turno ativo. */
export async function addCashMovement(input: CashMovementInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Utilizador não autenticado.");

  const { data, error } = await supabase
    .from("cash_movements")
    .insert({
      shift_id: input.shiftId,
      type: input.type,
      amount: input.amount,
      reason: input.reason,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Calcula o saldo esperado consolidando vendas e movimentações. */
export async function getShiftCalculatedTotals(shiftId: string) {
  const supabase = createClient();

  const { data: shift, error: shiftError } = await supabase
    .from("cash_shifts")
    .select("opening_float")
    .eq("id", shiftId)
    .single();

  if (shiftError) throw shiftError;

  const { data: sales } = await supabase
    .from("sales")
    .select("payment_method, total_amount")
    .eq("shift_id", shiftId)
    .eq("status", "completed");

  let salesCash = 0;
  let salesMulticaixa = 0;
  let salesTransfer = 0;

  (sales ?? []).forEach((sale) => {
    const value = Number(sale.total_amount) || 0;
    if (sale.payment_method === "Numerário") salesCash += value;
    else if (sale.payment_method === "Multicaixa") salesMulticaixa += value;
    else if (sale.payment_method === "Transferência") salesTransfer += value;
  });

  const { data: movements } = await supabase
    .from("cash_movements")
    .select("type, amount")
    .eq("shift_id", shiftId);

  let totalSuprimentos = 0;
  let totalSangrias = 0;

  (movements ?? []).forEach((movement) => {
    const value = Number(movement.amount) || 0;
    if (movement.type === "suprimento") totalSuprimentos += value;
    if (movement.type === "sangria") totalSangrias += value;
  });

  const openingFloat = Number(shift.opening_float) || 0;
  const expectedCashInDrawer = openingFloat + salesCash + totalSuprimentos - totalSangrias;

  return {
    openingFloat,
    salesCash,
    salesMulticaixa,
    salesTransfer,
    totalSuprimentos,
    totalSangrias,
    expectedCashInDrawer,
    totalExpected: expectedCashInDrawer + salesMulticaixa + salesTransfer,
  };
}

/** Encerra o turno e grava o Relatório Z. */
export async function executeShiftClosure(payload: CloseShiftPayload) {
  const supabase = createClient();
  const totals = await getShiftCalculatedTotals(payload.shiftId);

  const cashDiscrepancy = payload.declaredCash - totals.expectedCashInDrawer;
  const multicaixaDiscrepancy = payload.declaredMulticaixa - totals.salesMulticaixa;
  const transferDiscrepancy = payload.declaredTransfer - totals.salesTransfer;
  const totalDeclared = payload.declaredCash + payload.declaredMulticaixa + payload.declaredTransfer;
  const totalDiscrepancy = totalDeclared - totals.totalExpected;

  const { data: closure, error: closureError } = await supabase
    .from("shift_closures")
    .insert({
      shift_id: payload.shiftId,
      opening_float: totals.openingFloat,
      total_sales_cash: totals.salesCash,
      total_suprimentos: totals.totalSuprimentos,
      total_sangrias: totals.totalSangrias,
      expected_cash: totals.expectedCashInDrawer,
      declared_cash: payload.declaredCash,
      cash_discrepancy: cashDiscrepancy,
      expected_multicaixa: totals.salesMulticaixa,
      declared_multicaixa: payload.declaredMulticaixa,
      expected_transfer: totals.salesTransfer,
      declared_transfer: payload.declaredTransfer,
      total_expected: totals.totalExpected,
      total_declared: totalDeclared,
      total_discrepancy: totalDiscrepancy,
      notes: payload.notes || null,
    })
    .select()
    .single();

  if (closureError) throw closureError;

  const { error: shiftUpdateError } = await supabase
    .from("cash_shifts")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", payload.shiftId);

  if (shiftUpdateError) throw shiftUpdateError;

  return closure;
}
