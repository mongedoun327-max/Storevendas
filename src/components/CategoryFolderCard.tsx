"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layers, Pencil, Trash2, MoreVertical, Package, ChevronRight } from "lucide-react";

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  color?: string;
}

export interface CategoryFolderProps {
  id: string;
  name: string;
  totalProducts: number;
  totalSalesKz: number;
  colorHex?: string;
  products: ProductItem[];
  onSelectCategory?: (id: string) => void;
  onEditCategory?: (id: string) => void;
  onDeleteCategory?: (id: string) => void;
}

const DEFAULT_CARD_COLORS = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-emerald-500",
];

export const CategoryFolderCard: React.FC<CategoryFolderProps> = ({
  id,
  name,
  totalProducts,
  totalSalesKz,
  colorHex = "#32D583",
  products = [],
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Garante que nunca fique sem cartões visíveis dentro da pasta
  const displayProducts =
    products && products.length > 0
      ? products
      : [
          { id: `${id}-p1`, name: `${name} Artigo 1`, price: 1500 },
          { id: `${id}-p2`, name: `${name} Artigo 2`, price: 3200 },
          { id: `${id}-p3`, name: `${name} Artigo 3`, price: 4800 },
        ];

  return (
    <div
      onClick={() => onSelectCategory?.(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex cursor-pointer flex-col justify-between rounded-3xl border border-gray-200/80 bg-white dark:bg-[#131313] dark:border-white/10 p-6 transition-all duration-300 hover:border-gray-300 hover:shadow-xl dark:hover:border-white/20 dark:hover:bg-[#181818] dark:hover:shadow-2xl shadow-sm select-none"
    >
      {/* CABEÇALHO + FERRAMENTAS (EDITAR / ELIMINAR) */}
      <div className="z-30 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: colorHex }}
          />
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {name}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-gray-400 font-medium">
              {totalProducts || displayProducts.length} produtos registados
            </p>
          </div>
        </div>

        {/* Menu de Ações Rápidas */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-gray-400 transition hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            title="Opções da categoria"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* Dropdown Flutuante */}
          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-50 w-36 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1c] p-1.5 shadow-2xl backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEditCategory?.(id);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-gray-200 transition hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDeleteCategory?.(id);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 transition hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ÁREA DA PASTA ANIMADA 3D */}
      <div className="relative my-8 flex h-44 items-center justify-center">
        {/* Fundo da Pasta (Back Cover) */}
        <div
          className="absolute bottom-0 h-32 w-48 rounded-2xl opacity-85 transition-transform duration-300 shadow-sm"
          style={{ backgroundColor: colorHex, filter: "brightness(0.65)" }}
        />

        {/* CARTÕES DE PRODUTOS DENTRO DA CATEGORIA (Visíveis e em Efeito Leque ao passar o rato) */}
        <div className="absolute bottom-4 flex items-center justify-center z-10">
          {displayProducts.slice(0, 3).map((prod, idx) => {
            const offsets = [
              { y: -10, rotate: -10, x: -22 },
              { y: -20, rotate: 0, x: 0 },
              { y: -30, rotate: 10, x: 22 },
            ];
            const offset = offsets[idx] || { y: -15, rotate: 0, x: 0 };

            return (
              <motion.div
                key={prod.id || idx}
                initial={false}
                animate={
                  isHovered
                    ? {
                        y: offset.y - 38,
                        rotate: offset.rotate,
                        x: offset.x,
                        scale: 1.08,
                      }
                    : {
                        y: -18 - idx * 8, // Peeks out 25-45px above front pocket so cards are clearly visible
                        rotate: (idx - 1) * 3,
                        x: (idx - 1) * 6,
                        scale: 1 - (2 - idx) * 0.03,
                      }
                }
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: idx * 0.04,
                }}
                className={`absolute h-20 w-40 rounded-xl border border-white/30 p-2.5 text-white shadow-lg ${
                  DEFAULT_CARD_COLORS[idx % DEFAULT_CARD_COLORS.length]
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-xs font-bold leading-tight">{prod.name}</p>
                  <Package className="h-3 w-3 shrink-0 opacity-75" />
                </div>
                <p className="mt-1.5 text-[11px] font-mono font-semibold opacity-95">
                  {prod.price.toLocaleString("pt-AO")} Kz
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Capa Frontal da Pasta (Front Pocket) com Gradiente Glassmorphism */}
        <motion.div
          animate={
            isHovered
              ? { rotateX: -26, y: 14, scale: 0.98 }
              : { rotateX: 0, y: 0, scale: 1 }
          }
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          style={{ transformOrigin: "bottom center" }}
          className="absolute bottom-0 flex h-24 w-52 items-end justify-between rounded-2xl border border-white/30 p-3 shadow-2xl backdrop-blur-md overflow-hidden z-20"
        >
          <div
            className="absolute inset-0 rounded-2xl opacity-90"
            style={{ backgroundColor: colorHex }}
          />
          <div className="relative z-10 flex w-full items-center justify-between text-white">
            <div className="flex items-center gap-1.5 opacity-95">
              <Layers className="h-4 w-4" />
              <span className="text-[11px] font-bold">
                {displayProducts.length} itens
              </span>
            </div>
            <span className="text-[11px] font-black tracking-wider uppercase opacity-95 font-mono">
              {(totalSalesKz || displayProducts.reduce((acc, p) => acc + p.price, 0)).toLocaleString("pt-AO")} Kz
            </span>
          </div>
        </motion.div>
      </div>

      {/* RODAPÉ DO CARD COM AÇÕES RÁPIDAS AO PASSAR O RATO */}
      <div className="z-20 flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-3 text-xs text-zinc-500 dark:text-gray-400">
        <span className="text-[11px] font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors flex items-center gap-1">
          Clique para gerir stock
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditCategory?.(id);
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Editar Categoria"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCategory?.(id);
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Eliminar Categoria"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryFolderCard;
