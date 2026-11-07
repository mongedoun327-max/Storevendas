import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Trophy, Plus, Check, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { INITIAL_PRODUCTS } from '../../data/mockData';
import { formatKz } from '../../utils/formatters';

// Unidades vendidas por produto (vazio em sistema limpo)
const UNITS_SOLD: Record<string, number> = {};

// Top produtos mais vendidos do mês (derivado dos produtos reais + unidades simuladas)
const TOP_PRODUCTS = INITIAL_PRODUCTS.map((p) => {
  const unitsSold = UNITS_SOLD[p.id] ?? 0;
  return {
    id: p.id,
    name: p.name,
    price: p.salePrice,
    unitsSold,
    totalRevenue: unitsSold * p.salePrice,
    image: p.imageUrl,
  };
})
  .sort((a, b) => b.totalRevenue - a.totalRevenue)
  .slice(0, 10)
  .map((p, i) => ({ ...p, rank: i + 1 }));

interface TopProductsCarouselProps {
  onAddToCart?: (productId: string) => void;
  autoPlayInterval?: number;
}

export const TopProductsCarousel: React.FC<TopProductsCarouselProps> = ({ 
  onAddToCart,
  autoPlayInterval = 3200 
}) => {
  if (!TOP_PRODUCTS || TOP_PRODUCTS.length === 0) {
    return null;
  }

  const [activeIndex, setActiveIndex] = useState(Math.min(2, TOP_PRODUCTS.length - 1));
  const [addedId, setAddedId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeProduct = TOP_PRODUCTS[activeIndex];

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % TOP_PRODUCTS.length);
  const handlePrev = () =>
    setActiveIndex((prev) => (prev - 1 + TOP_PRODUCTS.length) % TOP_PRODUCTS.length);

  // Efeito de movimento automático contínuo e suave
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TOP_PRODUCTS.length);
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, autoPlayInterval]);

  const handleAddToCart = (productId: string) => {
    setAddedId(productId);
    onAddToCart?.(productId);
    window.setTimeout(() => setAddedId(null), 1500);
  };

  const monthTotal = useMemo(
    () => TOP_PRODUCTS.reduce((sum, p) => sum + p.totalRevenue, 0),
    [],
  );

  return (
    <div 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full bg-white border border-gray-100/90 rounded-3xl p-6 shadow-xs relative overflow-hidden select-none"
    >
      <div className="absolute top-0 right-1/4 -mt-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Cabeçalho do Carrossel */}
      <div className="flex items-center justify-between mb-4 z-10 relative gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 border border-amber-200/60 rounded-xl">
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-black text-zinc-950 tracking-tight">
              Top Produtos Mais Vendidos do Mês
            </h2>
            <p className="text-xs text-zinc-400">
              {formatKz(monthTotal)} em rotação de balcão
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Produto anterior"
            className="w-9 h-9 bg-zinc-50 hover:bg-zinc-100 border border-gray-200 text-zinc-700 hover:text-zinc-950 rounded-xl flex items-center justify-center transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Próximo produto"
            className="w-9 h-9 bg-zinc-50 hover:bg-zinc-100 border border-gray-200 text-zinc-700 hover:text-zinc-950 rounded-xl flex items-center justify-center transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Área do arco 3D (wheel carousel) */}
      <div className="relative w-full h-[280px] flex items-center justify-center [perspective:1000px] my-2">
        {TOP_PRODUCTS.map((product, index) => {
          const offset = index - activeIndex;
          const isActive = index === activeIndex;

          const rotateZ = offset * 10;
          const translateY = Math.abs(offset) * 20;
          const translateX = offset * 170;
          const scale = isActive ? 1.05 : 0.82;
          const opacity = Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.28;

          return (
            <motion.div
              key={product.id}
              onClick={() => setActiveIndex(index)}
              animate={{
                x: translateX,
                y: translateY,
                rotateZ,
                scale,
                opacity,
                zIndex: 20 - Math.abs(offset),
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className={`absolute cursor-pointer w-60 bg-zinc-950 border ${
                isActive
                  ? 'border-emerald-500 shadow-[0_0_16px_rgba(5,150,105,0.16)]'
                  : 'border-zinc-800'
              } rounded-2xl p-4 flex flex-col items-center text-center transition-colors duration-300`}
            >
              {/* Badge do rank */}
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-black border border-zinc-800 px-2.5 py-0.5 rounded-full">
                <Trophy className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-black text-white">#{product.rank}</span>
              </div>

              {/* Unidades vendidas */}
              <div className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {product.unitsSold} un.
              </div>

              {/* Imagem do produto */}
              <div className="w-24 h-24 my-2 flex items-center justify-center">
                <img
                  src={product.image || '/placeholder.svg'}
                  alt={product.name}
                  crossOrigin="anonymous"
                  className="max-h-full w-full object-cover rounded-xl drop-shadow-[0_8px_12px_rgba(0,0,0,0.9)]"
                />
              </div>

              {/* Nome e preço */}
              <h3 className="text-xs font-bold text-white line-clamp-1 w-full">{product.name}</h3>
              <p className="text-xs text-emerald-700 font-bold mt-0.5">{formatKz(product.price)}</p>

              {/* Botão adicionar ao PDV */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product.id);
                }}
                className={`w-full mt-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  addedId === product.id
                    ? 'bg-emerald-500 text-black'
                    : 'bg-zinc-900 text-white hover:bg-emerald-600 hover:text-white border border-zinc-800'
                }`}
              >
                {addedId === product.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Adicionado</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Adicionar</span>
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Rodapé com destaque do produto ativo */}
      {activeProduct && (
        <div className="relative z-10 flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-zinc-900 line-clamp-1">{activeProduct.name}</span>
          </div>
          <div className="text-right shrink-0 pl-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Faturado no mês</p>
            <p className="text-sm font-black text-zinc-950">{formatKz(activeProduct.totalRevenue)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopProductsCarousel;
