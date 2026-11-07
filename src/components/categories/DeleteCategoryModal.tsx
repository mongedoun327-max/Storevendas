"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ArrowRightLeft, AlertTriangle, Loader2 } from "lucide-react";

export interface DeleteCategoryModalProps {
  isOpen: boolean;
  categoryToDelete: {
    id: string;
    name: string;
    colorHex?: string;
    totalProducts?: number;
  } | null;
  availableCategories: Array<{
    id: string;
    name: string;
    colorHex?: string;
    totalProducts?: number;
  }>;
  onClose: () => void;
  onConfirm: (categoryId: string, targetCategoryId: string | null) => Promise<void>;
}

export function DeleteCategoryModal({
  isOpen,
  categoryToDelete,
  availableCategories,
  onClose,
  onConfirm,
}: DeleteCategoryModalProps) {
  const [deleteMode, setDeleteMode] = useState<"reassign" | "direct">("reassign");
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !categoryToDelete) return null;

  const otherCategories = availableCategories.filter(
    (c) => c.id !== categoryToDelete.id
  );

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      const target = deleteMode === "reassign" ? (targetCategoryId || (otherCategories[0]?.id ?? null)) : null;
      await onConfirm(categoryToDelete.id, target);
      onClose();
    } catch (error) {
      console.error("Erro ao eliminar categoria:", error);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop com desfoque */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isDeleting && onClose()}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Card do Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#131313] p-6 text-white shadow-2xl space-y-5"
        >
          {/* Botão Fechar */}
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Cabeçalho */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-lg">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Eliminar Categoria</h3>
              <p className="text-xs text-gray-400">
                Escolha o tratamento dos produtos vinculados a esta categoria.
              </p>
            </div>
          </div>

          {/* Categoria Alvo em Destaque */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3.5">
            <div className="flex items-center gap-2.5">
              <span
                className="h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: categoryToDelete.colorHex || "#32D583" }}
              />
              <span className="font-bold text-sm text-white">
                {categoryToDelete.name}
              </span>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-gray-300">
              {categoryToDelete.totalProducts ?? 0} produtos associados
            </span>
          </div>

          {/* Seleção de Estratégia de Eliminação */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
              Estratégia de Eliminação
            </label>

            {/* Opção A: Reatribuir e Eliminar (RPC) */}
            <div
              onClick={() => !isDeleting && setDeleteMode("reassign")}
              className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                deleteMode === "reassign"
                  ? "border-emerald-500/80 bg-emerald-500/10 ring-1 ring-emerald-500/50"
                  : "border-white/10 bg-[#181818] hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="deleteStrategy"
                  checked={deleteMode === "reassign"}
                  onChange={() => setDeleteMode("reassign")}
                  className="mt-1 accent-emerald-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <ArrowRightLeft className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      Opção A: Reatribuir produtos para outra categoria
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                    Executa a função RPC no Postgres transferindo todos os artigos para outra categoria antes de remover o registo.
                  </p>

                  {deleteMode === "reassign" && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <label className="mb-1.5 block text-[11px] font-semibold text-gray-300">
                        Categoria de Destino:
                      </label>
                      <select
                        value={targetCategoryId || ""}
                        onChange={(e) => setTargetCategoryId(e.target.value || null)}
                        disabled={isDeleting}
                        className="w-full rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">(Nenhuma) Enviar produtos para "Sem Categoria" (NULL)</option>
                        {otherCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.totalProducts ?? 0} produtos)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Opção B: Eliminar diretamente (SET NULL) */}
            <div
              onClick={() => !isDeleting && setDeleteMode("direct")}
              className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                deleteMode === "direct"
                  ? "border-rose-500/80 bg-rose-500/10 ring-1 ring-rose-500/50"
                  : "border-white/10 bg-[#181818] hover:border-white/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="deleteStrategy"
                  checked={deleteMode === "direct"}
                  onChange={() => setDeleteMode("direct")}
                  className="mt-1 accent-rose-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    <span className="text-xs font-bold text-white">
                      Opção B: Eliminar diretamente (ON DELETE SET NULL)
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                    Remove a categoria. O gatilho de integridade do Postgres desassocia automaticamente os produtos sem excluí-los.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-50 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50 shadow-lg shadow-rose-600/20"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  A eliminar...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Confirmar Eliminação
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default DeleteCategoryModal;
