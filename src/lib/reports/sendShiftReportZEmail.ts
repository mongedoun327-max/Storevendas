import { Resend } from "resend";
import { generateReportZBuffer, ReportZPayload } from "@/lib/reports/generateReportZBuffer";

let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY não configurada no ambiente.");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export async function sendShiftReportZEmail(data: ReportZPayload) {
  try {
    const resend = getResendClient();
    const pdfBuffer = generateReportZBuffer(data);
    const dateStr = new Date().toISOString().split("T")[0];

    const recipient = process.env.SUPERVISOR_EMAIL || "miguelworscoi@gmail.com";

    const response = await resend.emails.send({
      from: "Masakula ERP <onboarding@resend.dev>",
      to: [recipient],
      subject: `[Fecho Z] Shift #${data.shiftId.slice(0, 8)} - ${data.operatorName} (${data.difference < 0 ? "Quebra" : "OK"})`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Relatório Z de Encerramento de Turno</h2>
          <p>O turno do operador <strong>${data.operatorName}</strong> foi encerrado.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <ul style="line-height: 1.8; list-style: none; padding-left: 0;">
            <li><strong>Total de Vendas:</strong> ${(data.totalSales).toLocaleString("pt-AO")} Kz</li>
            <li><strong>Esperado em Dinheiro:</strong> ${data.expectedCash.toLocaleString("pt-AO")} Kz</li>
            <li><strong>Contado no Caixa:</strong> ${data.actualCash.toLocaleString("pt-AO")} Kz</li>
            <li><strong>Diferença:</strong> <span style="color: ${data.difference < 0 ? '#e11d48' : '#10b981'}; font-weight: bold;">${data.difference.toLocaleString("pt-AO")} Kz</span></li>
          </ul>
          <p style="color: #64748b; font-size: 13px; margin-top: 20px;">O relatório oficial formatado em PDF encontra-se anexado a esta mensagem.</p>
        </div>
      `,
      attachments: [
        {
          filename: `Relatorio_Z_${data.shiftId.slice(0, 8)}_${dateStr}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return { success: true, id: response.data?.id };
  } catch (error: any) {
    console.error("Falha ao enviar e-mail com Relatório Z:", error);
    return { success: false, error: error.message || error };
  }
}

export default sendShiftReportZEmail;
