import React, { useState } from "react";
import { Plus, Check } from "lucide-react";

export interface ProductCardItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  image?: string;
}

export interface ProductCardProps {
  product: ProductCardItem;
  onAddToCart: (product: ProductCardItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAdd = () => {
    onAddToCart(product);
    setIsAdded(true);

    // Timeout para restaurar o botão de volta ao estado inicial
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const rawImage = product.imageUrl || product.image;
  const imageSrc = !imageError && rawImage ? rawImage : null;

  return (
    <div
      onClick={handleAdd}
      className={`group bg-white rounded-2xl p-4 shadow-xs border transition-all duration-200 flex flex-col justify-between select-none cursor-pointer active:scale-[0.98] ${
        isAdded
          ? "border-[#32D583]/60 bg-emerald-50/30 shadow-md ring-2 ring-[#32D583]/20"
          : "border-neutral-100 hover:border-neutral-300 hover:shadow-md"
      }`}
    >
      {/* Área da Imagem (PNG transparente / sem fundo) */}
      <div className="relative w-full h-36 mb-3 flex items-center justify-center rounded-xl bg-neutral-50/70 p-2 group-hover:bg-neutral-100/60 transition-colors">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="max-h-32 w-auto object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110 pointer-events-none"
          />
        ) : (
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400 font-bold text-xl border border-neutral-200/60 shadow-xs">
            {product.name ? product.name.charAt(0).toUpperCase() : "P"}
          </div>
        )}
      </div>

      {/* Informações do Produto */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase truncate">
          {product.category || "Geral"}
        </span>
        <h4 className="text-sm font-bold text-neutral-800 line-clamp-1 leading-snug" title={product.name}>
          {product.name}
        </h4>

        {/* Linha de Preço e Botão Interativo */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
          <span className="text-base font-extrabold text-neutral-900">
            {product.price.toLocaleString("pt-AO", {
              style: "currency",
              currency: "AOA",
            })}
          </span>

          {/* Botão com Fundo Preto -> Verde no Hover e Estado Confirmado */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAdd();
            }}
            disabled={isAdded}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-xs
              ${
                isAdded
                  ? "bg-[#32D583] text-black shadow-sm scale-105"
                  : "bg-black text-white hover:bg-[#32D583] hover:text-black"
              }
            `}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Adicionado</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
