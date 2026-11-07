import React, { useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Trash2, RefreshCw, Check, Sparkles, Scan, Camera } from "lucide-react";
import { BorderParticles } from "./admin/BorderParticles";
import { SmartProductImageUpload } from "./SmartProductImageUpload";
import { OfflineCameraModal } from "./ui/OfflineCameraModal";
import { Product } from "../types";
import { hardwareService } from "../services/hardwareIntegration";

export interface ProductFormData {
  name: string;
  price: number;
  category: string;
  barcode?: string;
  imageUrl?: string;
  imageFile?: File | null;
}

export interface ProductFormModalProps {
  onClose: () => void;
  onSave: (data: ProductFormData) => void;
  productToEdit?: Product | null;
}

export function ProductFormModal({ onClose, onSave, productToEdit }: ProductFormModalProps) {
  const [name, setName] = useState(productToEdit?.name || "");
  const [price, setPrice] = useState(productToEdit?.salePrice ? String(productToEdit.salePrice) : "");
  const [category, setCategory] = useState(productToEdit?.category || "Bebidas");
  const [barcode, setBarcode] = useState(productToEdit?.barcode || "");
  const [scannerStatus, setScannerStatus] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(productToEdit?.imageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMode, setUploadMode] = useState<"smart" | "standard">("smart");

  useEffect(() => {
    const unsubscribe = hardwareService.onScan((scanned) => {
      setBarcode(scanned);
      setScannerStatus(`Código de fábrica capturado: ${scanned}`);
      hardwareService.playBeep('success');
      setTimeout(() => setScannerStatus(null), 3000);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || "");
      setPrice(productToEdit.salePrice ? String(productToEdit.salePrice) : "");
      setCategory(productToEdit.category || "Bebidas");
      setBarcode(productToEdit.barcode || "");
      setPreviewUrl(productToEdit.imageUrl || null);
    }
  }, [productToEdit]);

  const triggerParticles = () => {
    setShowParticles(true);
    setTimeout(() => {
      setShowParticles(false);
    }, 2800);
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setImageFile(file);
    triggerParticles();

    // Converte para Base64 persistente para renderização garantida imediata
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setShowParticles(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Base64 imediato e garantido para persistência local
      let finalImageUrl = previewUrl || "";

      // 2. Tenta fazer upload para Supabase Storage se disponível
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append("file", imageFile);
          const res = await fetch("/api/upload/product-image", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              finalImageUrl = data.url;
            }
          }
        } catch (err) {
          console.warn("Storage upload fallback para Base64:", err);
        }
      }

      onSave({
        name,
        price: parseFloat(price) || 0,
        category,
        barcode: barcode.trim() || undefined,
        imageUrl: finalImageUrl || undefined,
        imageFile,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              {productToEdit ? "Editar Produto e Imagem" : "Novo Produto (PNG Transparente)"}
            </h3>
            <p className="text-xs text-neutral-400">
              {productToEdit ? "Altere os dados, troque ou remova a imagem do artigo" : "Defina os dados e a imagem do artigo"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Modo de Carregamento */}
          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setUploadMode("smart")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                uploadMode === "smart"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E1FB15]" />
              <span>Remover Fundo IA</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("standard")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                uploadMode === "standard"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Upload Normal</span>
            </button>
          </div>

          {/* Modo 1: Smart AI Background Removal */}
          {uploadMode === "smart" ? (
            <SmartProductImageUpload
              initialImageUrl={previewUrl}
              onImageProcessed={(url, blob) => {
                setPreviewUrl(url);
                const file = new File([blob], "processed_product.webp", { type: "image/webp" });
                setImageFile(file);
                triggerParticles();
              }}
            />
          ) : (
            /* Modo 2: Standard Upload com Partículas */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={showParticles ? { animation: "borderGlowPulse 1.8s ease-in-out infinite" } : undefined}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 transition-all duration-300 relative overflow-visible ${
                showParticles || previewUrl
                  ? "border-[#32D583] bg-emerald-50/20"
                  : isDragging
                  ? "border-[#E1FB15] bg-lime-50/50 scale-[0.99]"
                  : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100"
              }`}
            >
              {/* Emissão de Partículas Verdes a partir da Borda Pontilhada */}
              <BorderParticles active={showParticles} count={32} />

              {previewUrl ? (
                <div className="flex flex-col items-center gap-3 w-full py-1">
                  <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-xl p-2 border border-neutral-200/80 shadow-xs">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="max-h-28 w-auto object-contain animate-in zoom-in-75 duration-300 drop-shadow-md pointer-events-none"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="Eliminar Foto"
                      className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1.5 shadow-md transition-colors cursor-pointer z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Ações Rápidas: Trocar Imagem ou Eliminar */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold cursor-pointer transition shadow-xs">
                      <RefreshCw className="w-3.5 h-3.5 text-[#32D583]" />
                      <span>Trocar Foto</span>
                      <input
                        type="file"
                        accept="image/png,image/webp,image/jpeg"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center cursor-pointer py-3 w-full text-center">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-200/60 flex items-center justify-center text-neutral-500 mb-2">
                    <ImageIcon className="w-6 h-6 text-neutral-500" />
                  </div>
                  <span className="text-xs font-bold text-neutral-800">Carregar Foto / PNG sem fundo</span>
                  <span className="text-[11px] text-neutral-400 mt-0.5">Arraste ou clique para selecionar</span>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1">Recomendado: 400x400px transparente</span>
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1">Nome do Artigo *</label>
            <input
              required
              type="text"
              value={name}
              placeholder="Ex: Coca-Cola 330ml, Cuca Lata 330ml..."
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black transition"
            />
          </div>

          {/* Código de Barras de Fábrica (com leitor de bip) */}
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Scan size={14} className="text-emerald-600" />
                Código de Barras de Fábrica (Embalagem) *
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Leitor Ativo
              </span>
            </div>
            <div className="flex gap-2">
              <input
                required
                type="text"
                value={barcode}
                placeholder="Bipe a embalagem com o aparelho ou digite..."
                onChange={(e) => setBarcode(e.target.value)}
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="button"
                onClick={() => {
                  const val = prompt('Digitar ou bipar código da embalagem:');
                  if (val && val.trim()) {
                    setBarcode(val.trim());
                    hardwareService.playBeep('success');
                  }
                }}
                className="px-3 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 cursor-pointer"
              >
                Bipar
              </button>
            </div>
            {scannerStatus ? (
              <p className="text-[11px] font-bold text-emerald-700">✓ {scannerStatus}</p>
            ) : (
              <p className="text-[10px] text-neutral-500">
                O sistema depende dos códigos de fábrica originais contidos nos produtos.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Preço de Venda (Kz)</label>
              <input
                required
                type="number"
                step="any"
                min="0"
                value={price}
                placeholder="Ex: 850"
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black bg-white transition"
              >
                <option value="Bebidas">Bebidas</option>
                <option value="Medicamentos">Medicamentos</option>
                <option value="Informática">Informática</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Snacks">Snacks</option>
                <option value="Higiene">Higiene</option>
                <option value="Geral">Geral</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-[#32D583] hover:text-black transition-all duration-200 mt-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isSubmitting ? "A guardar..." : productToEdit ? "Atualizar Artigo" : "Guardar Produto"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProductFormModal;
