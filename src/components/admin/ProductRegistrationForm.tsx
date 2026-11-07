import React, { useState } from "react";
import { ImageUploadDropzone } from "./ImageUploadDropzone";

export interface ProductRegistrationFormProps {
  onSuccess?: (product: any) => void;
  className?: string;
}

export function ProductRegistrationForm({ onSuccess, className = "" }: ProductRegistrationFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Bebidas");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    let imageUrl = "";

    try {
      // 1. Converte o arquivo para Base64 persistente
      if (imageFile) {
        const base64Promise = new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string || "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(imageFile);
        });
        imageUrl = await base64Promise;

        // Tenta também enviar para a API se disponível
        try {
          const formData = new FormData();
          formData.append("file", imageFile);
          const uploadRes = await fetch("/api/upload/product-image", {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              imageUrl = uploadData.url;
            }
          }
        } catch {
          // Mantém o base64
        }
      }

      // 2. Guardar o produto na base de dados com a imagem
      const productData = {
        name,
        price: parseFloat(price) || 0,
        category,
        imageUrl,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        const createdProduct = await res.json().catch(() => productData);
        setMessage({ type: "success", text: "Produto registado com sucesso!" });
        setName("");
        setPrice("");
        setCategory("Bebidas");
        setImageFile(null);
        if (onSuccess) {
          onSuccess(createdProduct);
        }
      } else {
        setMessage({ type: "error", text: "Erro ao registar o produto." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão ao registar o produto." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 max-w-md bg-neutral-950 p-6 rounded-2xl border border-neutral-800 ${className}`}
    >
      {/* Campo de Upload de Imagem */}
      <ImageUploadDropzone onImageSelected={(file) => setImageFile(file)} />

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-medium ${
            message.type === "success"
              ? "bg-[#32D583]/10 text-[#32D583] border border-[#32D583]/30"
              : "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label className="text-xs text-neutral-400">Nome do Produto</label>
        <input
          required
          type="text"
          placeholder="Ex: Água Mineral Cuca 500ml"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-white mt-1 focus:outline-none focus:border-[#E1FB15]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-400">Preço (Kz)</label>
          <input
            required
            type="number"
            step="any"
            min="0"
            placeholder="Ex: 500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-white mt-1 focus:outline-none focus:border-[#E1FB15]"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-400">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-sm text-white mt-1 focus:outline-none focus:border-[#E1FB15]"
          >
            <option value="Bebidas">Bebidas</option>
            <option value="Snacks">Snacks</option>
            <option value="Geral">Geral</option>
          </select>
        </div>
      </div>

      <button
        disabled={loading}
        type="submit"
        className="w-full bg-[#E1FB15] text-black font-bold py-3 rounded-lg hover:bg-opacity-90 transition mt-2 disabled:opacity-50 cursor-pointer"
      >
        {loading ? "A guardar..." : "Registar Produto"}
      </button>
    </form>
  );
}

export default ProductRegistrationForm;
