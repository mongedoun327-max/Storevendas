import { EscPosEncoder } from "@/utils/escposEncoder";
import { SerialQueueManager } from "@/utils/serialQueue";
import type { ShiftSummary } from "@/types/shift";

export async function printThermalReportZ(summary: ShiftSummary): Promise<void> {
  const formatKz = (value: number) => `${value.toLocaleString("pt-AO")} Kz`;
  const encoder = new EscPosEncoder();

  encoder
    .initialize()
    .align("center")
    .bold(true)
    .size(2, 2)
    .line("WORSCOI STORE")
    .size(1, 1)
    .line("FECHO DE CAIXA - RELATORIO Z")
    .bold(false)
    .line(`Turno: ${summary.shiftId.slice(0, 8)}`)
    .line("--------------------------------")
    .align("left")
    .line(`Operador: ${summary.operatorName}`)
    .line(`Abertura: ${new Date(summary.openedAt).toLocaleString("pt-AO")}`)
    .line(`Fecho:    ${new Date(summary.closedAt).toLocaleString("pt-AO")}`)
    .line(`Vendas:   ${summary.salesCount}`)
    .line("--------------------------------")
    .line(`Numerario:    ${formatKz(summary.expectedAmounts.numerario)}`)
    .line(`Multicaixa:   ${formatKz(summary.expectedAmounts.multicaixa)}`)
    .line(`Transferencia: ${formatKz(summary.expectedAmounts.transferencia)}`)
    .line("--------------------------------")
    .bold(true)
    .line(`Total:        ${formatKz(summary.expectedAmounts.total)}`)
    .line(`Diferenca:    ${formatKz(summary.discrepancies.total)}`)
    .bold(false)
    .line("--------------------------------")
    .align("center")
    .line("Relatorio Z emitido")
    .feed(2)
    .cut();

  await SerialQueueManager.getInstance().enqueuePrint(encoder.encode());
}
