import { shiftClosingService, type CloseShiftDTO } from '../services/shiftClosingService';

/**
 * Universal Route Handler (compatível com Web Standard Request/Response, Next.js App Router e Edge Functions)
 */
export async function POST(req: Request) {
  try {
    const body: CloseShiftDTO = await req.json();
    const { shift_id, actual_cash } = body;

    if (!shift_id || actual_cash === undefined || actual_cash === null) {
      return Response.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    const result = await shiftClosingService.closeShift(body);

    if (!result.success) {
      const isNotFoundOrClosed = result.error?.includes("Turno não encontrado ou já encerrado");
      const isInvalidParams = result.error?.includes("Parâmetros inválidos") || result.error?.includes("Valor real");
      const statusCode = isNotFoundOrClosed ? 404 : isInvalidParams ? 400 : 500;

      return Response.json({ error: result.error, details: result.details }, { status: statusCode });
    }

    return Response.json({
      success: true,
      reportZ: result.reportZ,
    });
  } catch (error: any) {
    return Response.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

/**
 * Express Handler para backends Node.js/Express
 */
export const expressCloseShiftHandler = async (req: any, res: any) => {
  try {
    const body: CloseShiftDTO = req.body;
    const { shift_id, actual_cash } = body;

    if (!shift_id || actual_cash === undefined || actual_cash === null) {
      return res.status(400).json({ error: "Parâmetros inválidos." });
    }

    const result = await shiftClosingService.closeShift(body);

    if (!result.success) {
      const isNotFoundOrClosed = result.error?.includes("Turno não encontrado ou já encerrado");
      const isInvalidParams = result.error?.includes("Parâmetros inválidos") || result.error?.includes("Valor real");
      const statusCode = isNotFoundOrClosed ? 404 : isInvalidParams ? 400 : 500;

      return res.status(statusCode).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      reportZ: result.reportZ,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Erro interno" });
  }
};
