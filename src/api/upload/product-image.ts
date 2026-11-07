import { supabaseAdmin } from '../../lib/supabase/admin';

/**
 * Interface de Resposta do Upload de Imagem de Produto
 */
export interface ProductImageUploadResult {
  url?: string;
  error?: string;
}

/**
 * Função utilitária universal para upload de imagem de produto para o Supabase Storage (Bucket 'products')
 */
export async function uploadProductImage(file: File): Promise<ProductImageUploadResult> {
  try {
    if (!file) {
      return { error: "Nenhum ficheiro enviado" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Upload para o bucket 'products'
    const { data, error } = await supabaseAdmin.storage
      .from("products")
      .upload(fileName, buffer, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (error) {
      return { error: error.message };
    }

    // Gerar URL público
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("products")
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl };
  } catch (error: any) {
    return { error: error?.message || "Erro no servidor ao carregar imagem" };
  }
}

/**
 * Universal Route Handler (Compatível com Web Fetch API e Next.js App Router)
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "Nenhum ficheiro enviado" }, { status: 400 });
    }

    const result = await uploadProductImage(file);

    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json({ url: result.url }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: "Erro no servidor ao carregar imagem" }, { status: 500 });
  }
}

/**
 * Express Request/Response Handler
 */
export const expressUploadHandler = async (req: any, res: any) => {
  try {
    const file = req.file || (req.files && req.files.file);
    if (!file) {
      return res.status(400).json({ error: "Nenhum ficheiro enviado" });
    }

    const buffer = file.buffer;
    const fileName = `${Date.now()}-${(file.originalname || "image.png").replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { data, error } = await supabaseAdmin.storage
      .from("products")
      .upload(fileName, buffer, {
        contentType: file.mimetype || "image/png",
        upsert: true,
      });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("products")
      .getPublicUrl(data.path);

    return res.status(200).json({ url: publicUrlData.publicUrl });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro no servidor ao carregar imagem" });
  }
};

export { POST as uploadProductImageRoute };
export default POST;
