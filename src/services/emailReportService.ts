import { Resend } from "resend";
import type { ShiftSummary } from "@/types/shift";

let resendClient: Resend | null = null;
const DESTINATION_EMAIL = "miguelworscoi@gmail.com";

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY não configurada no ambiente.");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

export async function sendShiftReportEmail(report: ShiftSummary) {
  const formatKz = (value: number) => `${value.toLocaleString("pt-AO")} Kz`;
  const operatorName = escapeHtml(report.operatorName);
  const shiftId = escapeHtml(report.shiftId.slice(0, 8));
  const openedAt = escapeHtml(new Date(report.openedAt).toLocaleString("pt-AO"));
  const closedAt = escapeHtml(new Date(report.closedAt).toLocaleString("pt-AO"));
  const reportDate = new Date().toLocaleDateString("pt-AO");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: monospace; background-color: #0b0b0b; color: #ffffff; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #131313; border: 1px solid #333; border-radius: 16px; padding: 24px;">
          <h2 style="color: #E1FB15; text-align: center; margin-bottom: 4px;">WORSCOI POS</h2>
          <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 0;">FECHO DE CAIXA - RELATÓRIO Z</p>
          <hr style="border-color: #333;" />

          <table style="width: 100%; font-size: 13px; color: #ddd; margin-bottom: 16px;">
            <tr><td><strong>Operador:</strong></td><td style="text-align: right;">${operatorName}</td></tr>
            <tr><td><strong>ID Turno:</strong></td><td style="text-align: right;">${shiftId}</td></tr>
            <tr><td><strong>Abertura:</strong></td><td style="text-align: right;">${openedAt}</td></tr>
            <tr><td><strong>Fecho:</strong></td><td style="text-align: right;">${closedAt}</td></tr>
            <tr><td><strong>Qtd. Vendas:</strong></td><td style="text-align: right;">${report.salesCount}</td></tr>
          </table>

          <hr style="border-color: #333;" />
          <h3 style="color: #32D583; font-size: 14px;">Resumo Financeiro</h3>

          <table style="width: 100%; font-size: 12px; color: #fff; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #444; color: #888;">
                <th style="text-align: left; padding: 6px 0;">MEIO</th>
                <th style="text-align: right;">ESPERADO</th>
                <th style="text-align: right;">DECLARADO</th>
                <th style="text-align: right;">DIFERENÇA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 6px 0;">Numerário</td>
                <td style="text-align: right;">${formatKz(report.expectedAmounts.numerario)}</td>
                <td style="text-align: right;">${formatKz(report.declaredAmounts.numerario)}</td>
                <td style="text-align: right; font-weight: bold;">${formatKz(report.discrepancies.numerario)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;">Multicaixa</td>
                <td style="text-align: right;">${formatKz(report.expectedAmounts.multicaixa)}</td>
                <td style="text-align: right;">${formatKz(report.declaredAmounts.multicaixa)}</td>
                <td style="text-align: right; font-weight: bold;">${formatKz(report.discrepancies.multicaixa)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0;">Transferência</td>
                <td style="text-align: right;">${formatKz(report.expectedAmounts.transferencia)}</td>
                <td style="text-align: right;">${formatKz(report.declaredAmounts.transferencia)}</td>
                <td style="text-align: right; font-weight: bold;">${formatKz(report.discrepancies.transferencia)}</td>
              </tr>
            </tbody>
          </table>

          <hr style="border-color: #333; margin-top: 16px;" />
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold;">
            <span>Total Faturado:</span>
            <span style="color: #E1FB15;">${formatKz(report.expectedAmounts.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-top: 6px;">
            <span>Diferença Geral:</span>
            <span style="color: ${report.discrepancies.total < 0 ? "#f43f5e" : "#32D583"};">
              ${formatKz(report.discrepancies.total)}
            </span>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: "Worscoi POS <pos@worscoi.com>",
      to: DESTINATION_EMAIL,
      subject: `[Relatório Z] Fecho de Caixa - ${report.operatorName} (${reportDate})`,
      html: htmlContent,
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao enviar relatório por e-mail:", error);
    return { success: false, error };
  }
}
