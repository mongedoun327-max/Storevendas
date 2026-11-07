import { sendShiftReportEmail } from "@/services/emailReportService";
import {
  executeShiftClosure,
  type CloseShiftPayload,
} from "@/services/cashShiftService";
import { printThermalReportZ } from "@/utils/thermalReportPrint";
import type { ShiftSummary } from "@/types/shift";

export async function finalizeShiftClosure(summary: ShiftSummary): Promise<void> {
  const payload: CloseShiftPayload = {
    shiftId: summary.shiftId,
    declaredCash: summary.declaredAmounts.numerario,
    declaredMulticaixa: summary.declaredAmounts.multicaixa,
    declaredTransfer: summary.declaredAmounts.transferencia,
  };

  await executeShiftClosure(payload);
  const emailResult = await sendShiftReportEmail(summary);
  if (!emailResult.success) {
    throw emailResult.error instanceof Error
      ? emailResult.error
      : new Error("Não foi possível enviar o Relatório Z por e-mail.");
  }
  await printThermalReportZ(summary);
}
