"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Tag, Check, Layers, Plus } from "lucide-react";
import { Category } from "@/hooks/useCategories";

export interface ProductCategorySelectProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onChange: (categoryId: string | null) => void;
  onCreateNewCategory?: () => void; // Callback para abrir o modal de criação
  error?: string;
}

export function ProductCategorySelect({
  categories,
  selectedCategoryId,
  onChange,
  onCreateNewCategory,
  error,
}: ProductCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="mb-2 block text-xs font-semibold text-gray-300">
        Categoria do Produto
      </label>

      {/* Botão do Seletor */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-2xl border bg-[#181818] p-3 transition-all duration-200 focus:outline-none cursor-pointer ${
          error
            ? "border-rose-500/50"
            : isOpen
            ? "border-emerald-500/50 ring-2 ring-emerald-500/10"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <div className="flex items-center gap-3 truncate">
          {selectedCategory ? (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-black shadow-md transition-all duration-300"
              style={{
                backgroundColor: selectedCategory.colorHex,
                boxShadow: `0 6px 16px ${selectedCategory.colorHex}40, inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.3)`,
              }}
            >
              <Tag className="h-3.5 w-3.5 text-black/80" />
              <span className="truncate">{selectedCategory.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5">
                <Layers className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <span>Selecione uma categoria (opcional)</span>
            </div>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-400" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Flutuante */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-40 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-[#161616] p-2 shadow-2xl backdrop-blur-xl scrollbar-thin scrollbar-thumb-white/10"
          >
            {/* BOTÃO ATALHO: "+ Nova Categoria" */}
            {onCreateNewCategory && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onCreateNewCategory();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20 active:scale-[0.99] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar Nova Categoria</span>
                </button>

                <div className="my-2 h-[1px] bg-white/5" />
              </>
            )}

            {/* Opção "Sem Categoria" */}
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl p-2.5 text-xs transition cursor-pointer ${
                selectedCategoryId === null
                  ? "bg-white/10 text-white font-semibold"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
                <span>Sem Categoria</span>
              </div>
              {selectedCategoryId === null && (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              )}
            </button>

            <div className="my-1.5 h-[1px] bg-white/5" />

            {/* Lista de Categorias Disponíveis */}
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onChange(cat.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl p-2.5 text-xs transition cursor-pointer ${
                    isSelected
                      ? "bg-white/10 text-white font-bold"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-md shadow-sm"
                      style={{
                        backgroundColor: cat.colorHex,
                        boxShadow: `inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 6px ${cat.colorHex}40`,
                      }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </div>

                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-rose-400">{error}</p>
      )}
    </div>
  );
}

export default ProductCategorySelect;
