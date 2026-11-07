"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, RotateCcw, Package, Layers, ShoppingBag, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface TrashItem {
  id: string;
  name: string;
  type: string;
  size?: string;
  date?: string;
  category?: string;
}

export interface AnimatedTrashManagerProps {
  initialItems?: TrashItem[];
  onPermanentDelete?: (item: TrashItem) => void;
  onRestore?: (item: TrashItem) => void;
  onClose?: () => void;
}

const STORAGE_KEY = "masakula_trash_manager_items_v2";

export function AnimatedTrashManager({
  initialItems,
  onPermanentDelete,
  onRestore,
  onClose,
}: AnimatedTrashManagerProps) {
  const [items, setItems] = useState<TrashItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn("Erro ao carregar lixeira do localStorage:", e);
      }
    }
    return initialItems ?? [];
  });

  const [pendingItem, setPendingItem] = useState<TrashItem | null>(null);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const DELETE_TIMEOUT = 5000; // 5 segundos para desfazer

  // Sincroniza estado com o localStorage para que ao sair e voltar, os itens excluídos não reapareçam
  const persistItems = (newItems: TrashItem[]) => {
    setItems(newItems);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      } catch (e) {
        console.warn("Erro ao salvar lixeira:", e);
      }
    }
  };

  const startPendingDelete = (item: TrashItem) => {
    // Se já havia item pendente, consuma-o imediatamente
    if (pendingItem) {
      finalizeDelete(pendingItem);
    }

    setPendingItem(item);
    persistItems(items.filter((i) => i.id !== item.id));
    setProgress(100);

    const startTime = Date.now();
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / DELETE_TIMEOUT) * 100);
      setProgress(remaining);
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 50);

    timerRef.current = setTimeout(() => {
      finalizeDelete(item);
    }, DELETE_TIMEOUT);
  };

  const finalizeDelete = (item: TrashItem) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    onPermanentDelete?.(item);
    setPendingItem(null);
  };

  const undoDelete = () => {
    if (!pendingItem) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const restoredItems = [pendingItem, ...items];
    persistItems(restoredItems);
    onRestore?.(pendingItem);
    setPendingItem(null);
  };

  const clearAllItems = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    items.forEach((it) => onPermanentDelete?.(it));
    persistItems([]);
    setPendingItem(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
      case "documento":
        return <Layers className="w-4 h-4 text-zinc-600" />;
      case "imagem":
        return <Package className="w-4 h-4 text-zinc-600" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-zinc-600" />;
    }
  };

  return (
    <div className="workspace-panel w-full max-w-2xl mx-auto space-y-5 p-5 text-zinc-950 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950">Lixeira do Sistema</h3>
            <p className="text-sm text-zinc-600">
              {items.length === 0
                ? "Lixeira limpa e organizada."
                : `${items.length} ${items.length === 1 ? "item disponível" : "itens disponíveis"} para restauro ou eliminação definitiva.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={clearAllItems}
              type="button"
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Esvaziar Lixeira
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              aria-label="Fechar lixeira"
              className="workspace-secondary-action min-h-10 px-3 text-sm"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* Undo Banner flutuante / integrado com Barra de Progresso */}
      <AnimatePresence>
        {pendingItem && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="relative overflow-hidden rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-950"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold">Item a remover: </span>
                  <span className="font-mono text-rose-800">“{pendingItem.name}”</span>
                </div>
              </div>

              <button
                type="button"
                onClick={undoDelete}
                className="workspace-primary-action min-h-11 px-3.5 text-sm cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Desfazer
              </button>
            </div>

            {/* Linha de progresso regressivo */}
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-rose-200">
              <motion.div
                className="h-full bg-rose-600"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de itens na lixeira */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-600 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <p className="text-sm font-semibold text-zinc-800">Lixeira vazia</p>
            <p className="text-xs text-zinc-500">Nenhum arquivo ou item removido pendente.</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="workspace-panel-muted group flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-zinc-300 hover:bg-white"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {item.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-600">
                      <span>{item.type}</span>
                      {item.size && <span>• {item.size}</span>}
                      {item.date && <span>• {item.date}</span>}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startPendingDelete(item)}
                  aria-label={`Remover ${item.name} desta demonstração`}
                  title="Eliminar permanentemente"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default AnimatedTrashManager;
