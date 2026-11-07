import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { SmartProductImageUpload } from "../SmartProductImageUpload";
import { PackagePlus, Save, Loader2, Tag, DollarSign, Barcode, CheckCircle2, AlertCircle, Scan } from "lucide-react";
import { hardwareService } from "../../services/hardwareIntegration";

interface CreateProductFormProps {
  onProductCreated?: () => void;
  onClose?: () => void;
}

export function CreateProductForm({ onProductCreated, onClose }: CreateProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Guardar o Blob da imagem tratada pela IA
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const unsubscribe = hardwareService.onScan((scanned) => {
      setCode(scanned);
      hardwareService.playBeep('success');
      setStatusMessage({ type: 'success', text: `Código de fábrica capturado pelo leitor: ${scanned}` });
    });
    return () => unsubscribe();
  }, []);

  const handleImageProcessed = (_previewUrl: string, blob: Blob) => {
    setProcessedBlob(blob);
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!processedBlob) {
      setStatusMessage({ type: "error", text: "Por favor, faça o upload da imagem do produto." });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(null);

      // 1. Gerar nome único para a imagem WebP no bucket
      const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const filePath = `items/${fileName}`;

      // 2. Upload do Blob para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, processedBlob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Erro ao enviar foto para o bucket: ${uploadError.message}`);
      }

      // 3. Obter a URL Pública da imagem
      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // 4. Inserir o produto na tabela 'products'
      const { error: insertError } = await supabase.from("products").insert([
        {
          name,
          code,
          price: parseFloat(price),
          stock: parseInt(stock, 10),
          image_url: imageUrl,
        },
      ]);

      if (insertError) {
        throw new Error(`Erro ao salvar produto na BD: ${insertError.message}`);
      }

      setStatusMessage({
        type: "success",
        text: "Produto cadastrado com sucesso!"
      });

      // Limpar formulário
      setName("");
      setCode("");
      setPrice("");
      setStock("");
      setProcessedBlob(null);

      if (onProductCreated) {
        onProductCreated();
      }

    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || "Ocorreu um erro ao cadastrar o produto.";
      setStatusMessage({
        type: "error",
        text: errMsg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-neutral-950 border border-neutral-800 rounded-3xl p-6 text-white space-y-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#E1FB15]/10 border border-[#E1FB15]/30 rounded-2xl">
            <PackagePlus className="w-5 h-5 text-[#E1FB15]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Novo Produto no Catálogo</h2>
            <p className="text-xs text-neutral-400">Preencha os dados e carregue a fotografia otimizada</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 transition"
          >
            Fechar
          </button>
        )}
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-2xl text-xs font-semibold ${
            statusMessage.type === "success"
              ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-400"
              : "bg-rose-950/60 border border-rose-500/30 text-rose-400"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LADO ESQUERDO: UPLOAD INTELIGENTE */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Fotografia Oficial (1:1 HD Transparente)
          </label>
          <SmartProductImageUpload onImageProcessed={handleImageProcessed} />
        </div>

        {/* LADO DIREITO: CAMPOS DO PRODUTO */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-neutral-400 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#E1FB15]" /> Nome do Artigo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sipzy Lime Drink 330ml"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[#E1FB15] outline-none transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-neutral-400 flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-[#E1FB15]" /> Código de Barras de Fábrica (Embalagem) *
              </label>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                Leitor Ativo
              </span>
            </div>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Aponte o aparelho de bipar para a embalagem ou digite..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs font-mono text-white focus:border-[#E1FB15] outline-none transition"
            />
            <p className="text-[10px] text-neutral-500 mt-1">
              O sistema não gera códigos automáticos. Utilize o código de barras contido de fábrica na embalagem.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-400 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#32D583]" /> Preço de Venda (Kz)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 3900"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[#32D583] outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-400 mb-1">
                Stock Inicial
              </label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Ex: 150"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[#E1FB15] outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#E1FB15] hover:bg-[#d4eb0f] text-black font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E1FB15]/10 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>A enviar foto e a guardar...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Cadastrar Produto na Nuvem</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CreateProductForm;
