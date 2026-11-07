"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, PackagePlus, Loader2 } from "lucide-react";

import { useCategories } from "@/hooks/useCategories";
import { ProductCategorySelect } from "./ProductCategorySelect";
import {
  CategoryFormModal,
  CategoryFormData,
} from "@/components/categories/CategoryFormModal";
import { showProductSuccessToast } from "@/lib/toasts/productToasts";

const productSchema = z.object({
  name: z.string().min(2, "O nome do produto é obrigatório."),
  price: z.coerce.number().min(1, "O preço deve ser superior a 0 Kz."),
  categoryId: z.string().nullable(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitProduct: (data: ProductFormData) => Promise<void>;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmitProduct,
}: ProductFormModalProps) {
  const { categories, createCategory } = useCategories();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      price: 0,
      categoryId: null,
    },
  });

  // Handler para submeter uma nova categoria criada de forma instantânea
  const handleQuickCreateCategory = async (data: CategoryFormData) => {
    // 1. Cria a categoria no Supabase
    const newCategory = await createCategory({
      name: data.name,
      colorHex: data.colorHex,
    });

    // 2. Define automaticamente a nova categoria no formulário do produto
    if (newCategory?.id) {
      setValue("categoryId", newCategory.id, { shouldValidate: true });
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmitProduct(data);

      const selectedCategory = categories.find((c) => c.id === data.categoryId);

      showProductSuccessToast({
        productName: data.name,
        price: data.price,
        category: selectedCategory
          ? {
              name: selectedCategory.name,
              colorHex: selectedCategory.colorHex,
            }
          : null,
      });

      reset();
      onClose();
    } catch (error) {
      console.error("Erro ao guardar produto:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#131313] p-6 text-white shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <PackagePlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Novo Produto</h3>
                <p className="text-xs text-gray-400">
                  Cadastre itens e associe a uma categoria em tempo real
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-300">
                  Nome do Produto
                </label>
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Ex: Coca-Cola 330ml, Teclado Mecânico..."
                  className="w-full rounded-2xl border border-white/10 bg-[#181818] px-4 py-3 text-xs text-white placeholder-gray-500 transition focus:border-emerald-500 focus:bg-[#1f1f1f] focus:outline-none"
                />
                {errors.name && (
                  <p className="mt-1.5 text-[11px] font-medium text-rose-400">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-300">
                  Preço de Venda (Kz)
                </label>
                <input
                  {...register("price")}
                  type="number"
                  step="100"
                  placeholder="0.00 Kz"
                  className="w-full rounded-2xl border border-white/10 bg-[#181818] px-4 py-3 text-xs text-white placeholder-gray-500 transition focus:border-emerald-500 focus:bg-[#1f1f1f] focus:outline-none"
                />
                {errors.price && (
                  <p className="mt-1.5 text-[11px] font-medium text-rose-400">
                    {errors.price.message}
                  </p>
                )}
              </div>

              {/* SELETOR DE CATEGORIA COM BOTÃO DE CRIAÇÃO RÁPIDA */}
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <ProductCategorySelect
                    categories={categories}
                    selectedCategoryId={field.value}
                    onChange={field.onChange}
                    onCreateNewCategory={() => setIsCategoryModalOpen(true)}
                    error={errors.categoryId?.message}
                  />
                )}
              />

              <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-[#32D583] px-5 py-2.5 text-xs font-bold text-black transition hover:bg-[#28c072] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      A registar...
                    </>
                  ) : (
                    "Registar Produto"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* MODAL ANINHADO PARA CRIAÇÃO RÁPIDA DE CATEGORIA (Z-INDEX SUPERIOR: z-[60]) */}
      <div className="relative z-[60]">
        <CategoryFormModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSubmit={handleQuickCreateCategory}
        />
      </div>
    </>
  );
}

export default ProductFormModal;
