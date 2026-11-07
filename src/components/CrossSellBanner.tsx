import React from 'react';
import { Sparkles, Plus } from 'lucide-react';

export interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  discountPercentage?: number;
}

export interface CrossSellBannerProps {
  suggestion: SuggestedProduct | null;
  onAddToCart: (product: SuggestedProduct) => void;
}

export default function CrossSellBanner({
  suggestion,
  onAddToCart,
}: CrossSellBannerProps) {
  if (!suggestion) return null;

  return (
    <div className="bg-[#131313] text-white p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md border border-[#E1FB15]/20 animate-fade-in">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="p-2 bg-[#E1FB15] text-[#131313] rounded-xl shrink-0">
          <Sparkles size={16} />
        </div>
        <div className="truncate">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sugestão de Venda Cruzada</p>
          <p className="text-xs font-bold text-white truncate">{suggestion.name}</p>
          <p className="text-[11px] font-black text-[#E1FB15]">
            +{suggestion.price.toLocaleString('pt-AO')} Kz
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAddToCart(suggestion)}
        className="px-3 py-2 bg-[#E1FB15] hover:bg-[#cbe210] text-[#131313] font-black text-xs rounded-xl flex items-center gap-1 shrink-0 transition cursor-pointer shadow-xs"
      >
        <Plus size={14} /> Adicionar
      </button>
    </div>
  );
}

export { CrossSellBanner };
