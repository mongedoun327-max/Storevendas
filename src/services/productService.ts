import { supabase } from "../lib/supabase";
import { INITIAL_PRODUCTS } from "../data/mockData";
import type { 
  Product, 
  CreateProductDTO, 
  ProductFilterParams,
  MovementType 
} from "../types/inventory";

export const productService = {
  /**
   * Buscar produtos com suporte a busca, filtros de estoque baixo e paginação
   */
  async getProducts(params: ProductFilterParams = {}) {
    const { search, categoryId, lowStockOnly, page = 1, limit = 20 } = params;

    try {
      let query = supabase
        .from("products")
        .select("*, category:categories(id, name, color), supplier:suppliers(id, name)", { count: "exact" })
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
      }

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (lowStockOnly) {
        query = query.filter("current_stock", "lte", "min_stock");
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (!error && data && data.length > 0) {
        return {
          products: (data || []) as Product[],
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        };
      }
    } catch (err) {
      console.warn("Supabase getProducts fallback notice:", err);
    }

    // Fallback local caso tabela ou conexão não esteja disponível
    const fallback: Product[] = INITIAL_PRODUCTS.map((p) => ({
      id: p.id,
      organization_id: "org-default",
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      cost_price: p.costPrice,
      selling_price: p.salePrice,
      min_stock: p.minStock,
      max_stock: 500,
      current_stock: p.stock,
      alert_expiration_days: 30,
      unit: "unit",
      type: "single",
      tax_rate: "ISE_0",
      image_url: p.imageUrl,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: p.updatedAt,
      category: {
        id: `cat-${p.category}`,
        organization_id: "org-default",
        name: p.category,
        slug: p.category.toLowerCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }));

    let filtered = fallback;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.sku && p.sku.toLowerCase().includes(s)) ||
          (p.barcode && p.barcode.includes(s))
      );
    }
    if (lowStockOnly) {
      filtered = filtered.filter((p) => p.current_stock <= p.min_stock);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const totalCount = filtered.length;
    const paginated = filtered.slice(from, to + 1);

    return {
      products: paginated,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  },

  /**
   * Buscar detalhes completos de um produto por ID
   */
  async getProductById(id: string): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(*), supplier:suppliers(*), batches:product_batches(*)")
        .eq("id", id)
        .single();

      if (!error && data) return data as Product;
    } catch (err) {
      console.warn("Supabase getProductById fallback notice:", err);
    }

    const found = INITIAL_PRODUCTS.find((p) => p.id === id);
    if (!found) {
      throw new Error(`Produto não encontrado com o ID: ${id}`);
    }

    return {
      id: found.id,
      organization_id: "org-default",
      name: found.name,
      sku: found.sku,
      barcode: found.barcode,
      cost_price: found.costPrice,
      selling_price: found.salePrice,
      min_stock: found.minStock,
      max_stock: 500,
      current_stock: found.stock,
      alert_expiration_days: 30,
      unit: "unit",
      type: "single",
      tax_rate: "ISE_0",
      image_url: found.imageUrl,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: found.updatedAt,
    };
  },

  /**
   * Cadastrar novo produto
   */
  async createProduct(organizationId: string, dto: CreateProductDTO): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert([{ ...dto, organization_id: organizationId }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  },

  /**
   * Atualizar dados do produto
   */
  async updateProduct(id: string, dto: Partial<CreateProductDTO>): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update(dto)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  },

  /**
   * Desativar produto (Soft Delete)
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  /**
   * Registrar movimentação manual de estoque (Entrada/Ajuste/Quebra)
   */
  async recordStockMovement(params: {
    organizationId: string;
    productId: string;
    batchId?: string;
    type: MovementType;
    quantityChange: number;
    notes?: string;
    userId?: string;
  }) {
    // 1. Obter estoque atual
    const product = await this.getProductById(params.productId);
    const previousStock = product.current_stock;
    const newStock = previousStock + params.quantityChange;

    if (newStock < 0) {
      throw new Error("Estoque insuficiente para esta operação.");
    }

    // 2. Inserir histórico (O Trigger SQL atualizará o saldo em 'products')
    const { data, error } = await supabase
      .from("stock_movements")
      .insert([
        {
          organization_id: params.organizationId,
          product_id: params.productId,
          batch_id: params.batchId,
          type: params.type,
          quantity: Math.abs(params.quantityChange),
          previous_stock: previousStock,
          new_stock: newStock,
          notes: params.notes,
          created_by: params.userId,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};

export default productService;
