import { cashMovementService, type CreateCashMovementDTO } from '../services/cashMovementService';

/**
 * Universal Route Handler (compatível com Web Standard Request/Response, Next.js App Router e Edge Functions)
 */
export async function POST(req: Request) {
  try {
    const body: CreateCashMovementDTO = await req.json();
    const result = await cashMovementService.registerCashMovement(body);

    if (!result.success) {
      const isValidationError = 
        result.error?.includes("Campos obrigatórios") ||
        result.error?.includes("Tipo inválido") ||
        result.error?.includes("maior que zero");

      const isShiftStatusError = result.error?.includes("turno fechado ou inexistente");

      const statusCode = isValidationError ? 400 : isShiftStatusError ? 422 : 500;

      return Response.json(
        { error: result.error, details: result.details },
        { status: statusCode }
      );
    }

    return Response.json({ success: true, data: result.data }, { status: 201 });
  } catch (error: any) {
    console.error("Erro no processamento da requisição de movimentação:", error);
    return Response.json(
      { error: "Erro interno ao processar movimentação", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * Express Request/Response Handler (para servidor Node.js/Express)
 */
export const expressCashMovementHandler = async (req: any, res: any) => {
  try {
    const body: CreateCashMovementDTO = req.body;
    const result = await cashMovementService.registerCashMovement(body);

    if (!result.success) {
      const isValidationError = 
        result.error?.includes("Campos obrigatórios") ||
        result.error?.includes("Tipo inválido") ||
        result.error?.includes("maior que zero");

      const isShiftStatusError = result.error?.includes("turno fechado ou inexistente");

      const statusCode = isValidationError ? 400 : isShiftStatusError ? 422 : 500;

      return res.status(statusCode).json({ error: result.error, details: result.details });
    }

    return res.status(201).json({ success: true, data: result.data });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro interno ao processar movimentação", details: error?.message });
  }
};
