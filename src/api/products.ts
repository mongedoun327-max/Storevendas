import { productService } from '../services/productService';
import type { CreateProductDTO } from '../types/inventory';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

/**
 * Universal Route Handlers (compatível com Next.js App Router, Web Fetch API e Edge Functions)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const lowStock = url.searchParams.get("lowStock") === "true";
    const page = Number(url.searchParams.get("page")) || 1;

    const result = await productService.getProducts({
      search,
      categoryId,
      lowStockOnly: lowStock,
      page,
      limit: 15,
    });

    return Response.json(result, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error?.message || "Erro interno ao buscar produtos" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, ...productData } = body;

    if (!organizationId) {
      return Response.json(
        { error: "organizationId é obrigatório" },
        { status: 400 }
      );
    }

    const newProduct = await productService.createProduct(organizationId, productData as CreateProductDTO);
    return Response.json(newProduct, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error?.message || "Erro interno ao cadastrar produto" }, { status: 400 });
  }
}

/**
 * Express Request/Response Handlers (para servidor Node.js/Express)
 */
export const expressHandlers = {
  async getProducts(req: any, res: any) {
    try {
      const search = (req.query.search as string) || undefined;
      const categoryId = (req.query.categoryId as string) || undefined;
      const lowStock = req.query.lowStock === "true";
      const page = Number(req.query.page) || 1;

      const result = await productService.getProducts({
        search,
        categoryId,
        lowStockOnly: lowStock,
        page,
        limit: 15,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || "Erro interno ao buscar produtos" });
    }
  },

  async createProduct(req: any, res: any) {
    try {
      const { organizationId, ...productData } = req.body;

      if (!organizationId) {
        return res.status(400).json({ error: "organizationId é obrigatório" });
      }

      const newProduct = await productService.createProduct(organizationId, productData);
      return res.status(201).json(newProduct);
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || "Erro interno ao cadastrar produto" });
    }
  }
};
