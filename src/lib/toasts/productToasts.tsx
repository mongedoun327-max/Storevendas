import React from "react";
import { toast } from "sonner";
import { CheckCircle2, Tag, Package } from "lucide-react";

export interface ShowProductSuccessToastProps {
  productName: string;
  price: number;
  category?: {
    name: string;
    colorHex: string;
  } | null;
}

export function showProductSuccessToast({
  productName,
  price,
  category,
}: ShowProductSuccessToastProps) {
  toast.custom((t) => (
    <div className="flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-[#141414]/90 p-4 font-sans text-white shadow-2xl backdrop-blur-xl">
      {/* Ícone de Sucesso */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="h-5 w-5" />
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-white truncate">{productName}</p>
          <span className="text-[11px] font-mono font-semibold text-emerald-400 shrink-0">
            {price.toLocaleString("pt-AO")} Kz
          </span>
        </div>

        <p className="mt-0.5 text-[11px] text-gray-400">
          Produto cadastrado com sucesso!
        </p>

        {/* Badge Claymorphism da Categoria (se houver) */}
        {category ? (
          <div className="mt-2.5 flex items-center">
            <div
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[10px] font-extrabold text-black transition-transform duration-200"
              style={{
                backgroundColor: category.colorHex,
                boxShadow: `0 4px 12px ${category.colorHex}55, inset 0 2px 3px rgba(255,255,255,0.6), inset 0 -2px 3px rgba(0,0,0,0.35)`,
              }}
            >
              <Tag className="h-3 w-3 text-black/80 stroke-[2.5]" />
              <span className="truncate">{category.name}</span>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-500">
            <Package className="h-3 w-3" />
            <span>Sem Categoria</span>
          </div>
        )}
      </div>
    </div>
  ));
}
