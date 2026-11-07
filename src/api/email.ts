import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not configured");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface SendAuditEmailPayload {
  toEmail?: string;
  supervisorName?: string;
  periodLabel?: string;
  operators: Array<{
    operatorName: string;
    totalShifts: number;
    totalSales: number;
    totalBreakage: number;
    totalSurplus: number;
    netDifference: number;
    accuracyRate: number;
  }>;
  summary: {
    totalSales: number;
    totalBreakage: number;
    totalSurplus: number;
    averageAccuracy: number;
  };
}

export async function sendAuditReportEmail(payload: SendAuditEmailPayload) {
  const resend = getResend();
  const recipient = payload.toEmail || process.env.SUPERVISOR_EMAIL || "miguelworscoi@gmail.com";
  const period = payload.periodLabel || "Últimos 30 dias";

  const rowsHtml = payload.operators
    .map(
      (op) => `
      <tr style="border-bottom: 1px solid #e5e5e5; font-size: 13px;">
        <td style="padding: 10px 8px; font-weight: bold; color: #171717;">${op.operatorName}</td>
        <td style="padding: 10px 8px; text-align: center; color: #525252;">${op.totalShifts}</td>
        <td style="padding: 10px 8px; text-align: right; color: #171717; font-family: monospace;">${op.totalSales.toLocaleString("pt-AO")} Kz</td>
        <td style="padding: 10px 8px; text-align: right; color: #e11d48; font-weight: bold; font-family: monospace;">${op.totalBreakage.toLocaleString("pt-AO")} Kz</td>
        <td style="padding: 10px 8px; text-align: right; color: #10b981; font-family: monospace;">+${op.totalSurplus.toLocaleString("pt-AO")} Kz</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: bold; font-family: monospace; color: ${op.netDifference < 0 ? '#e11d48' : '#10b981'};">${op.netDifference.toLocaleString("pt-AO")} Kz</td>
        <td style="padding: 10px 8px; text-align: center; font-weight: bold;">
          <span style="background: ${op.accuracyRate >= 90 ? '#dcfce7' : '#fee2e2'}; color: ${op.accuracyRate >= 90 ? '#15803d' : '#b91c1c'}; padding: 3px 8px; border-radius: 6px; font-size: 11px;">
            ${op.accuracyRate}%
          </span>
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório de Auditoria de Caixa - Masakula ERP</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: #0f172a; padding: 24px 32px; color: #ffffff;">
          <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #94a3b8; text-transform: uppercase;">MASAKULA ERP • AUDITORIA</div>
          <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">Relatório de Desempenho & Quebras de Caixa</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">Período: <strong>${period}</strong> | Emitido em: ${new Date().toLocaleDateString("pt-AO")} às ${new Date().toLocaleTimeString("pt-AO")}</p>
        </div>

        <!-- KPI Cards -->
        <div style="padding: 24px 32px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 130px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
              <div style="font-size: 11px; color: #64748b; font-weight: 600;">Total Quebras</div>
              <div style="font-size: 18px; font-weight: 800; color: #e11d48; font-family: monospace; margin-top: 4px;">
                ${payload.summary.totalBreakage.toLocaleString("pt-AO")} Kz
              </div>
            </div>
            <div style="flex: 1; min-width: 130px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
              <div style="font-size: 11px; color: #64748b; font-weight: 600;">Total Sobras</div>
              <div style="font-size: 18px; font-weight: 800; color: #10b981; font-family: monospace; margin-top: 4px;">
                +${payload.summary.totalSurplus.toLocaleString("pt-AO")} Kz
              </div>
            </div>
            <div style="flex: 1; min-width: 130px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
              <div style="font-size: 11px; color: #64748b; font-weight: 600;">Acurácia Média</div>
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; font-family: monospace; margin-top: 4px;">
                ${payload.summary.averageAccuracy}%
              </div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div style="padding: 24px 32px;">
          <h2 style="font-size: 14px; font-weight: 700; margin: 0 0 12px 0; color: #0f172a;">Detalhamento por Operador de Caixa</h2>
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f1f5f9; font-size: 11px; color: #475569; text-transform: uppercase;">
                <th style="padding: 8px;">Operador</th>
                <th style="padding: 8px; text-align: center;">Turnos</th>
                <th style="padding: 8px; text-align: right;">Vendas</th>
                <th style="padding: 8px; text-align: right;">Quebras</th>
                <th style="padding: 8px; text-align: right;">Sobras</th>
                <th style="padding: 8px; text-align: right;">Saldo</th>
                <th style="padding: 8px; text-align: center;">Precisão</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
          Este e-mail foi gerado automaticamente pelo <strong>Masakula ERP & PDV</strong> para supervisão financeira.<br/>
          Destinatário configurado: <code>${recipient}</code>
        </div>
      </div>
    </body>
    </html>
  `;

  const { data, error } = await resend.emails.send({
    from: "Masakula ERP <onboarding@resend.dev>",
    to: [recipient],
    subject: `[Auditoria Masakula] Relatório de Quebras & Desempenho (${period})`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, messageId: data?.id, recipient };
}

export const expressSendAuditEmailHandler = async (req: any, res: any) => {
  try {
    const payload: SendAuditEmailPayload = req.body;
    if (!payload.operators || !payload.summary) {
      return res.status(400).json({ error: "Dados incompletos para envio do relatório." });
    }

    const result = await sendAuditReportEmail(payload);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao enviar e-mail com Resend:", error);
    return res.status(500).json({
      error: error.message || "Erro ao processar o envio de e-mail.",
      hint: !process.env.RESEND_API_KEY ? "Configure RESEND_API_KEY nas variáveis de ambiente." : undefined,
    });
  }
};

export { sendShiftReportZEmail } from "../lib/reports/sendShiftReportZEmail";

export const expressSendShiftReportZEmailHandler = async (req: any, res: any) => {
  try {
    const payload = req.body;
    if (!payload || !payload.shiftId) {
      return res.status(400).json({ error: "Dados inválidos para envio do Fecho Z." });
    }

    const { sendShiftReportZEmail } = await import("../lib/reports/sendShiftReportZEmail");
    const result = await sendShiftReportZEmail(payload);
    if (!result.success) {
      return res.status(500).json({ error: result.error || "Erro ao enviar e-mail." });
    }
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Erro ao despachar Fecho Z por e-mail:", error);
    return res.status(500).json({
      error: error.message || "Erro no processamento do e-mail do Fecho Z.",
    });
  }
};

