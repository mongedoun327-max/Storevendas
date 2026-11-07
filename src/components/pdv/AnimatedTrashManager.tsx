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

const DEFAULT_ITEMS: TrashItem[] = [
  { id: "1", name: "Relatorio-fecho-turno-z.pdf", type: "PDF", size: "1.2 MB", date: "Hoje, 14:30" },
  { id: "2", name: "Foto-artigo-gasosa-sumol.jpg", type: "Imagem", size: "3.4 MB", date: "Ontem" },
  { id: "3", name: "Backup-vendas-offline.zip", type: "Arquivo", size: "12.5 MB", date: "28 Fev" },
  { id: "4", name: "Recibo-anulado-10492.txt", type: "Documento", size: "15 KB", date: "27 Fev" },
];

export function AnimatedTrashManager({
  initialItems = DEFAULT_ITEMS,
  onPermanentDelete,
  onRestore,
  onClose,
}: AnimatedTrashManagerProps) {
  const [items, setItems] = useState<TrashItem[]>(initialItems);
  const [pendingItem, setPendingItem] = useState<TrashItem | null>(null);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const DELETE_TIMEOUT = 5000; // 5 segundos para desfazer

  const startPendingDelete = (item: TrashItem) => {
    // Se já havia item pendente, consuma-o imediatamente
    if (pendingItem) {
      finalizeDelete(pendingItem);
    }

    setPendingItem(item);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
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

    setItems((prev) => [pendingItem, ...prev]);
    onRestore?.(pendingItem);
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
            <h3 className="text-base font-bold text-zinc-950">Exemplo de lixeira</h3>
            <p className="text-sm text-zinc-600">Ações simuladas; pode desfazer durante 5 segundos.</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            aria-label="Fechar lixeira de demonstração"
            className="workspace-secondary-action min-h-10 px-3 text-sm"
          >
            Fechar
          </button>
        )}
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
            <p className="text-sm font-medium">Nenhum item nesta demonstração</p>
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
