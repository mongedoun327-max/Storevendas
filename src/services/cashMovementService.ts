import { supabase } from '../lib/supabase';
import type { MovementType } from '../types/cash';

export interface CreateCashMovementDTO {
  shift_id: string;
  operator_id?: string | null;
  type: MovementType | string;
  amount: number | string;
  reason: string;
}

export interface CashMovementResult {
  id: string;
  shift_id: string;
  operator_id?: string | null;
  type: MovementType;
  amount: number;
  reason: string;
  created_at: string;
  operators?: {
    name?: string;
  } | null;
}

export interface RegisterMovementResponse {
  success: boolean;
  data?: CashMovementResult;
  error?: string;
  details?: any;
}

export const cashMovementService = {
  /**
   * Registra uma movimentação de caixa (SANGRIA ou REFORÇO) no turno ativo.
   */
  async registerCashMovement(dto: CreateCashMovementDTO): Promise<RegisterMovementResponse> {
    try {
      const { shift_id, operator_id, type, amount, reason } = dto;

      // 1. Validação de campos obrigatórios
      if (!shift_id || !type || amount === undefined || amount === null || !reason) {
        return {
          success: false,
          error: "Campos obrigatórios ausentes: shift_id, type, amount, reason"
        };
      }

      // 2. Validação do tipo de movimento
      if (!["SANGRIA", "REFORCO"].includes(type)) {
        return {
          success: false,
          error: "Tipo inválido. Use SANGRIA ou REFORCO"
        };
      }

      // 3. Validação do valor numérico
      const numericAmount = typeof amount === "number" ? amount : parseFloat(String(amount));
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return {
          success: false,
          error: "O valor da movimentação deve ser maior que zero"
        };
      }

      // 4. Verificar se o turno está aberto antes de inserir
      const { data: shift, error: shiftError } = await supabase
        .from("shifts")
        .select("status")
        .eq("id", shift_id)
        .single();

      if (shiftError || !shift || shift.status !== "OPEN") {
        return {
          success: false,
          error: "Não é possível registar movimentações em um turno fechado ou inexistente"
        };
      }

      // 5. Inserção da Movimentação
      const { data: movement, error: insertError } = await supabase
        .from("cash_movements")
        .insert({
          shift_id,
          operator_id: operator_id || null,
          type,
          amount: numericAmount,
          reason: reason.trim(),
        })
        .select(`
          *,
          operators ( name )
        `)
        .single();

      if (insertError) {
        throw insertError;
      }

      return {
        success: true,
        data: movement as CashMovementResult
      };
    } catch (error: any) {
      console.error("Erro no registo de movimentação:", error);
      return {
        success: false,
        error: "Erro interno ao processar movimentação",
        details: error?.message || String(error)
      };
    }
  }
};
