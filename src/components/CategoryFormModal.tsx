"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Check, Loader2, Sparkles } from "lucide-react";

// Paleta Claymorphism com gradientes e tons neon/pastéis
const CLAY_COLOR_PRESETS = [
  { name: "Verde Menta", hex: "#32D583" },
  { name: "Amarelo Neon", hex: "#E1FB15" },
  { name: "Azul Ciano", hex: "#06B6D4" },
  { name: "Roxo Elétrico", hex: "#8B5CF6" },
  { name: "Rosa Neon", hex: "#EC4899" },
  { name: "Laranja Amber", hex: "#F59E0B" },
  { name: "Vermelho Coral", hex: "#F43F5E" },
  { name: "Cinza Titânio", hex: "#64748B" },
];

// Schema Zod para validação
const categoryFormSchema = z.object({
  name: z
    .string()
    .min(2, "O nome da categoria deve ter pelo menos 2 caracteres.")
    .max(30, "O nome não pode exceder 30 caracteres."),
  colorHex: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/, "Insira um código hexadecimal válido (ex: #32D583)."),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  initialData?: {
    id: string;
    name: string;
    colorHex: string;
  } | null;
  onClose: () => void;
  onSubmit: (data: CategoryFormData, id?: string) => Promise<void>;
}

export function CategoryFormModal({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const isEditing = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      colorHex: "#32D583",
    },
  });

  const selectedColor = watch("colorHex");

  // Atualiza os campos ao abrir o modal para edição ou reinicia para criação
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          colorHex: initialData.colorHex || "#32D583",
        });
      } else {
        reset({
          name: "",
          colorHex: "#32D583",
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      await onSubmit(data, initialData?.id);
      onClose();
    } catch (error) {
      console.error("Erro ao guardar categoria:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop com desfoque */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Card do Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#131313] p-6 text-white shadow-2xl"
        >
          {/* Botão Fechar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Cabeçalho */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 shadow-lg transition-colors duration-300"
              style={{
                backgroundColor: selectedColor,
                boxShadow: `0 8px 20px ${selectedColor}33, inset 0 2px 4px rgba(255,255,255,0.4)`,
              }}
            >
              <Sparkles className="h-5 w-5 text-black/80" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isEditing ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <p className="text-xs text-gray-400">
                {isEditing
                  ? "Atualize o nome e o estilo visual"
                  : "Defina o nome e a cor de identificação"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-6 space-y-5">
            {/* Campo: Nome da Categoria */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-300">
                Nome da Categoria
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Ex: Bebidas, Eletrónicos, Vestuário..."
                className="w-full rounded-2xl border border-white/10 bg-[#181818] px-4 py-3 text-xs text-white placeholder-gray-500 transition focus:border-emerald-500 focus:bg-[#1f1f1f] focus:outline-none"
              />
              {errors.name && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Seletor de Cores estilo Claymorphism */}
            <div>
              <label className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-emerald-400" />
                  Cor de Identificação (Claymorphism)
                </span>
                <span className="font-mono text-[10px] text-gray-400">
                  {selectedColor}
                </span>
              </label>

              {/* Grid de Swatches Claymorphic */}
              <div className="grid grid-cols-4 gap-3 rounded-2xl border border-white/5 bg-[#181818] p-3">
                {CLAY_COLOR_PRESETS.map((color) => {
                  const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setValue("colorHex", color.hex, { shouldValidate: true })}
                      title={color.name}
                      style={{
                        backgroundColor: color.hex,
                        boxShadow: isSelected
                          ? `0 6px 16px ${color.hex}66, inset 0 3px 6px rgba(255,255,255,0.6), inset 0 -3px 6px rgba(0,0,0,0.4)`
                          : `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)`,
                      }}
                      className={`relative flex h-10 items-center justify-center rounded-xl transition-all duration-200 active:scale-95 ${
                        isSelected
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[#181818] scale-105"
                          : "opacity-80 hover:opacity-100 hover:scale-100"
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4 text-black/80 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Input Customizado de Hexadecimal */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  {...register("colorHex")}
                  type="text"
                  placeholder="#32D583"
                  className="w-full rounded-xl border border-white/10 bg-[#181818] px-3 py-2 font-mono text-xs text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="color"
                  value={selectedColor || "#32D583"}
                  onChange={(e) => setValue("colorHex", e.target.value, { shouldValidate: true })}
                  className="h-9 w-12 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                />
              </div>
              {errors.colorHex && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-400">
                  {errors.colorHex.message}
                </p>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-[#32D583] px-5 py-2.5 text-xs font-bold text-black transition hover:bg-[#28c072] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    A guardar...
                  </>
                ) : (
                  <>{isEditing ? "Salvar Alterações" : "Criar Categoria"}</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CategoryFormModal;
