import { supabase } from '../lib/supabase';

export interface CloseShiftDTO {
  shift_id: string;
  actual_cash: number | string;
  closed_by_id?: string | null;
}

export interface ReportZPayload {
  shiftId: string;
  operatorId: string;
  operatorName?: string;
  openedAt: string;
  closedAt: string;
  initialCash: number;
  salesCash: number;
  salesCard: number;
  totalSales: number;
  totalSangria: number;
  totalReforco: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
}

export interface CloseShiftResponse {
  success: boolean;
  reportZ?: ReportZPayload;
  error?: string;
  details?: any;
}

export const shiftClosingService = {
  /**
   * Encerra o turno de caixa e calcula os valores consolidados para emissão do Relatório Z.
   */
  async closeShift(dto: CloseShiftDTO): Promise<CloseShiftResponse> {
    try {
      const { shift_id, actual_cash, closed_by_id } = dto;

      if (!shift_id || actual_cash === undefined || actual_cash === null) {
        return {
          success: false,
          error: "Parâmetros inválidos. shift_id e actual_cash são obrigatórios."
        };
      }

      // 1. Obter dados do turno atual
      const { data: shift, error: shiftErr } = await supabase
        .from("shifts")
        .select("*")
        .eq("id", shift_id)
        .single();

      if (shiftErr || !shift || shift.status !== "OPEN") {
        return {
          success: false,
          error: "Turno não encontrado ou já encerrado."
        };
      }

      // 2. Somar total de vendas do turno por método de pagamento
      const { data: sales, error: salesErr } = await supabase
        .from("sales")
        .select("payment_method, total_amount")
        .eq("shift_id", shift_id)
        .eq("status", "COMPLETED");

      if (salesErr) {
        console.warn("Aviso ao buscar vendas do turno:", salesErr);
      }

      const salesCash = (sales || [])
        .filter(s => s.payment_method === "CASH")
        .reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

      const salesCard = (sales || [])
        .filter(s => s.payment_method === "CARD" || s.payment_method === "MULTICAIXA" || s.payment_method === "TPA")
        .reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

      // 3. Somar movimentações (Sangrias e Reforços)
      const { data: movements, error: movErr } = await supabase
        .from("cash_movements")
        .select("type, amount")
        .eq("shift_id", shift_id);

      if (movErr) {
        console.warn("Aviso ao buscar movimentações do turno:", movErr);
      }

      const totalSangria = (movements || [])
        .filter(m => m.type === "SANGRIA")
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

      const totalReforco = (movements || [])
        .filter(m => m.type === "REFORCO")
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

      // 4. Executar os cálculos do Relatório Z
      const initialCash = Number(shift.initial_cash || 0);
      const expectedCash = initialCash + salesCash + totalReforco - totalSangria;
      const actualCashNum = typeof actual_cash === "number" ? actual_cash : parseFloat(String(actual_cash));

      if (isNaN(actualCashNum)) {
        return {
          success: false,
          error: "Valor real contado inválido."
        };
      }

      const difference = actualCashNum - expectedCash;

      // 5. Persistir encerramento no banco de dados
      const closedAt = new Date().toISOString();
      const { data: updatedShift, error: updateErr } = await supabase
        .from("shifts")
        .update({
          status: "CLOSED",
          closed_at: closedAt,
          closed_by_id: closed_by_id || null,
          sales_cash: salesCash,
          sales_card: salesCard,
          total_sangria: totalSangria,
          total_reforco: totalReforco,
          expected_cash: expectedCash,
          actual_cash: actualCashNum,
          difference: difference,
        })
        .eq("id", shift_id)
        .select()
        .single();

      if (updateErr) {
        throw updateErr;
      }

      // Obter nome do operador para a mensagem / e-mail
      let operatorName = "Operador";
      try {
        const { data: operator } = await supabase
          .from("operators")
          .select("name")
          .eq("id", updatedShift.operator_id)
          .single();

        if (operator?.name) {
          operatorName = operator.name;
        }
      } catch (opErr) {
        console.warn("Não foi possível carregar o nome do operador:", opErr);
      }

      const reportPayload = {
        shiftId: updatedShift.id,
        operatorId: updatedShift.operator_id,
        operatorName,
        openedAt: updatedShift.opened_at,
        closedAt: updatedShift.closed_at,
        initialCash,
        salesCash,
        salesCard,
        totalSales: salesCash + salesCard,
        totalSangria,
        totalReforco,
        expectedCash,
        actualCash: actualCashNum,
        difference,
      };

      // Disparo assíncrono em background (não bloqueia a UI ou resposta da API)
      if (typeof window === "undefined") {
        import("../lib/reports/sendShiftReportZEmail")
          .then(({ sendShiftReportZEmail }) => {
            sendShiftReportZEmail(reportPayload).catch((err) =>
              console.error("Erro em background no envio de e-mail:", err)
            );
          })
          .catch((err) => console.error("Erro ao carregar módulo de envio de e-mail:", err));
      } else {
        // No navegador, despacha via rota API segura
        fetch("/api/email/shift-report-z", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reportPayload),
        }).catch((err) =>
          console.warn("Erro ao despachar Fecho Z por e-mail em background:", err)
        );
      }

      // 6. Retornar estrutura pronta para impressão do Relatório Z
      return {
        success: true,
        reportZ: reportPayload,
      };
    } catch (error: any) {
      console.error("Erro no encerramento de turno:", error);
      return {
        success: false,
        error: error?.message || "Erro interno ao processar o encerramento do turno."
      };
    }
  }
};
