import { supabase } from '../lib/supabase';

export interface ApproveStockAuditParams {
  auditId: string;
  userId?: string;
}

export interface ApproveStockAuditResult {
  data: any | null;
  error: Error | null;
  success: boolean;
}

/**
 * Executes Supabase RPC `approve_stock_audit` to regularize and approve a physical stock count audit.
 *
 * @param params Object containing `auditId` and optional `userId`
 * @returns Object with `data`, `error`, and `success`
 *
 * @example
 * const { data, error } = await approveStockAudit({
 *   auditId: '123e4567-e89b-12d3-a456-426614174000',
 *   userId: user?.id
 * });
 *
 * if (error) console.error('Erro na aprovação:', error.message);
 * else console.log('Auditoria regularizada:', data);
 */
export async function approveStockAudit({
  auditId,
  userId,
}: ApproveStockAuditParams): Promise<ApproveStockAuditResult> {
  try {
    let effectiveUserId = userId;

    // Resolve authenticated user ID if not provided explicitly
    if (!effectiveUserId) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        effectiveUserId = userData.user?.id || '00000000-0000-0000-0000-000000000000';
      } catch {
        effectiveUserId = '00000000-0000-0000-0000-000000000000';
      }
    }

    const { data, error } = await supabase.rpc('approve_stock_audit', {
      p_audit_id: auditId,
      p_user_id: effectiveUserId,
    });

    if (error) {
      console.error('Erro na aprovação da auditoria de estoque:', error.message);
      return { data: null, error: new Error(error.message), success: false };
    }

    console.log('Auditoria regularizada com sucesso:', data);
    return { data, error: null, success: true };
  } catch (err: any) {
    console.error('Falha inesperada ao executar approve_stock_audit:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
      success: false,
    };
  }
}

export default approveStockAudit;
