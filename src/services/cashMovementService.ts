import { supabase } from '../lib/supabase';
import type { MovementType } from '../types/cash';
import { loadStoredCashSession, loadStoredCashMovements, saveStoredCashMovements } from '../utils/storage';

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

      // 4. Verificar se o turno está aberto (Supabase ou Local Session)
      let isShiftOpen = false;
      try {
        const { data: shift, error: shiftError } = await supabase
          .from("shifts")
          .select("status")
          .eq("id", shift_id)
          .single();

        if (!shiftError && shift && shift.status === "OPEN") {
          isShiftOpen = true;
        }
      } catch (err) {
        console.warn("Verificação remota de turno falhou, checando sessão local:", err);
      }

      if (!isShiftOpen) {
        const localSession = loadStoredCashSession();
        if (localSession && localSession.status === "OPEN") {
          isShiftOpen = true;
        }
      }

      // Permite o registo se o turno estiver aberto ou se for o turno ativo local
      if (!isShiftOpen && shift_id !== "active-shift") {
        return {
          success: false,
          error: "Não é possível registar movimentações em um turno fechado ou inexistente"
        };
      }

      // 5. Inserção da Movimentação (Tenta remoto, com fallback local garantido)
      try {
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

        if (!insertError && movement) {
          return {
            success: true,
            data: movement as CashMovementResult
          };
        }
      } catch (remErr) {
        console.warn("Inserção remota de movimento falhou, salvando localmente:", remErr);
      }

      // Fallback local: Salva no storage local
      const localMovementId = `mov-${Date.now()}`;
      const localMovementRecord: any = {
        id: localMovementId,
        type: type === "SANGRIA" ? "withdrawal" : "deposit",
        amount: numericAmount,
        reason: reason.trim(),
        timestamp: new Date().toISOString(),
        cashierName: "Operador de Caixa",
      };

      const storedMovements = loadStoredCashMovements();
      saveStoredCashMovements([localMovementRecord, ...storedMovements]);

      return {
        success: true,
        data: {
          id: localMovementId,
          shift_id,
          operator_id: operator_id || null,
          type: type as MovementType,
          amount: numericAmount,
          reason: reason.trim(),
          created_at: new Date().toISOString(),
          operators: { name: "Operador de Caixa" }
        }
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
