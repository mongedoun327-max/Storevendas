"use client";

import React, { useState } from "react";
import { CategoryFolderCard } from "@/components/categories/CategoryFolderCard";
import { CategoryFormModal, CategoryFormData } from "@/components/categories/CategoryFormModal";
import { DeleteCategoryModal } from "@/components/categories/DeleteCategoryModal";
import { useCategories, Category } from "@/hooks/useCategories";
import { Plus, FolderTree, Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

export default function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);

  const {
    categories,
    loading,
    error,
    refreshCategories,
    createCategory,
    updateCategory,
    deleteAndReassign,
  } = useCategories();

  // Abrir modal para nova categoria
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  // Abrir modal para edição
  const handleOpenEdit = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      setEditingCategory(cat);
      setIsModalOpen(true);
    }
  };

  // Abrir modal para eliminação
  const handleOpenDelete = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      setDeletingCategory(cat);
    }
  };

  // Enviar para Supabase ou API
  const handleSubmitCategory = async (data: CategoryFormData, id?: string) => {
    try {
      if (id) {
        await updateCategory(id, data);
      } else {
        await createCategory(data);
      }
    } catch (err) {
      console.error("Erro na submissão de categoria:", err);
    }
  };

  const handleConfirmDelete = async (
    categoryId: string,
    targetCategoryId: string | null
  ) => {
    await deleteAndReassign(categoryId, targetCategoryId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-400">
            <FolderTree className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Categorias de Produtos</h1>
            <p className="text-xs text-gray-400">Gestão e categorização dinâmica do catálogo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshCategories()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
            title="Atualizar lista"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-2xl bg-[#32D583] px-4 py-2.5 text-xs font-bold text-black transition hover:bg-[#28c072] shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Nova Categoria
          </button>
        </div>
      </div>

      {/* Erro de Carregamento */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid de Categorias */}
      {loading && categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <p className="text-xs font-medium">A carregar categorias...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-400 mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-white">Nenhuma categoria registada</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Crie categorias com paletas visuais personalizadas para organizar o seu inventário e agilizar o PDV.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <CategoryFolderCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              totalProducts={cat.totalProducts}
              totalSalesKz={cat.totalSalesKz}
              colorHex={cat.colorHex}
              products={cat.products || []}
              onSelectCategory={(id) => handleOpenEdit(id)}
              onEditCategory={handleOpenEdit}
              onDeleteCategory={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* Modal Zod + Claymorphism */}
      <CategoryFormModal
        isOpen={isModalOpen}
        initialData={editingCategory}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitCategory}
      />

      {/* Modal de Eliminação e Reatribuição Segura */}
      <DeleteCategoryModal
        isOpen={!!deletingCategory}
        categoryToDelete={deletingCategory}
        availableCategories={categories}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export { CategoriesPage };

