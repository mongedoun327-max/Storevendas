import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../../hooks/useProducts";
import { Plus, Flame, ChevronLeft, ChevronRight } from "lucide-react";

interface Carousel3DProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductCarousel3D({ products, onAddToCart }: Carousel3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!products || products.length === 0) return null;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  return (
    <div className="relative w-full bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 overflow-hidden select-none">
      
      {/* Header do Carrossel */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#E1FB15]/10 rounded-xl border border-[#E1FB15]/30">
            <Flame className="w-4 h-4 text-[#E1FB15]" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Top 10 Produtos em Destaque</h3>
            <p className="text-[10px] text-neutral-400">Mais vendidos esta semana</p>
          </div>
        </div>

        {/* Controlo Manual */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevSlide}
            className="p-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white hover:border-[#E1FB15]/50 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="p-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white hover:border-[#E1FB15]/50 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Arco / Área de Destaque 3D */}
      <div className="relative h-64 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {products.map((product, index) => {
            const offset = (index - activeIndex + products.length) % products.length;
            
            // Exibir apenas 3 itens no foco (anterior, ativo, seguinte)
            if (offset > 1 && offset < products.length - 1) return null;

            const isCurrent = offset === 0;
            const isNext = offset === 1;

            return (
              <motion.div
                key={product.id || `product-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: isCurrent ? 1 : 0.4,
                  scale: isCurrent ? 1 : 0.75,
                  x: isCurrent ? 0 : isNext ? 220 : -220,
                  zIndex: isCurrent ? 20 : 10,
                  rotateY: isCurrent ? 0 : isNext ? -25 : 25,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                onClick={() => setActiveIndex(index)}
                className={`absolute w-56 h-56 rounded-2xl p-4 flex flex-col justify-between items-center cursor-pointer border backdrop-blur-md transition-all ${
                  isCurrent
                    ? "bg-neutral-950/90 border-[#E1FB15]/60 shadow-[0_0_30px_rgba(225,251,21,0.15)]"
                    : "bg-neutral-950/40 border-neutral-800"
                }`}
              >
                {/* Badge de Posição Top */}
                <div className="w-full flex justify-between items-center">
                  <span className="text-[10px] font-black bg-[#E1FB15]/20 text-[#E1FB15] px-2 py-0.5 rounded-full border border-[#E1FB15]/30">
                    #{index + 1} Top Vendas
                  </span>
                  <span className="text-[10px] text-neutral-400 font-bold">{product.stock} un. em stock</span>
                </div>

                {/* Foto sem fundo do Supabase Storage */}
                <div className="relative h-28 w-full flex items-center justify-center my-1">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.9)]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 font-bold text-xs">
                      Sem Foto
                    </div>
                  )}
                </div>

                {/* Nome, Preço e Botão Adicionar */}
                <div className="w-full flex items-center justify-between pt-2 border-t border-neutral-800/80">
                  <div className="overflow-hidden pr-2">
                    <p className="text-xs font-bold text-white truncate">{product.name}</p>
                    <p className="text-xs font-black text-[#32D583]">
                      Kz {product.price?.toLocaleString("pt-AO") || "0"}
                    </p>
                  </div>

                  {isCurrent && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      className="p-2.5 bg-[#E1FB15] hover:bg-[#d4eb0f] text-black font-extrabold rounded-xl shadow-lg shadow-[#E1FB15]/20 transition flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ProductCarousel3D;
