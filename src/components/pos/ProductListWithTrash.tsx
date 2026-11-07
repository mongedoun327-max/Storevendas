// components/pos/ProductListWithTrash.tsx
"use client";

import React, { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Product } from "@/lib/db";
import {
  softDeleteLocal,
  restoreLocal,
  commitPermanentDelete,
} from "@/services/trashService";
import { Trash2, RotateCcw, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ProductListWithTrash() {
  const [pendingItem, setPendingItem] = useState<Product | null>(null);
  const [progress, setProgress] = useState(100);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const DELETE_TIMEOUT = 5000;

  // Consulta reativa ao Dexie.js: ignora itens em modo Soft Delete
  const products = useLiveQuery(
    () => db.products.filter((p) => !p.deleted_at).toArray(),
    []
  );

  // Inicia o processo de eliminação com timer
  const handleDelete = async (product: Product) => {
    // Se houver outro item aguardando confirmação, efetiva-o antes de iniciar novo
    if (pendingItem) {
      await commitPermanentDelete("products", pendingItem.id);
    }

    // 1. Soft Delete no Dexie (UI atualiza instantaneamente via live query)
    await softDeleteLocal("products", product.id);
    setPendingItem(product);
    setProgress(100);

    const startTime = Date.now();

    // 2. Animação de contagem regressiva da barra de progresso
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / DELETE_TIMEOUT) * 100);
      setProgress(remaining);
    }, 50);

    // 3. Timer de expiração para hard delete / sync Supabase
    timerRef.current = setTimeout(async () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      await commitPermanentDelete("products", product.id);
      setPendingItem(null);
    }, DELETE_TIMEOUT);
  };

  // Restauração do Item (Undo)
  const handleUndo = async () => {
    if (!pendingItem) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Reverte o registo no Dexie
    await restoreLocal("products", pendingItem.id);
    setPendingItem(null);
  };

  return (
    <div className="relative min-h-[400px] w-full max-w-lg rounded-3xl border border-white/10 bg-[#131313] p-6 text-white">
      <h3 className="mb-4 text-xs font-extrabold uppercase tracking-wider text-gray-400">
        Produtos Cadastrados ({products?.length ?? 0})
      </h3>

      <div className="space-y-3">
        <AnimatePresence>
          {products?.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.1,
                x: 180, // Trajetória até à lixeira flutuante no canto inferior
                y: 120,
                transition: { duration: 0.4 },
              }}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#181818] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E1FB15]/10 text-[#E1FB15]">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{item.name}</p>
                  <p className="text-[10px] text-gray-400">{item.price} Kz</p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(item)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Widget Flutuante de Lixeira com Undo */}
      <AnimatePresence>
        {pendingItem && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.8 }}
            className="absolute bottom-6 right-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1e1e1e] p-2.5 shadow-2xl backdrop-blur-xl"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <Trash2 className="h-5 w-5 animate-bounce" />
            </div>

            <div className="flex flex-col pr-2">
              <span className="text-[11px] text-gray-300">
                Apagado <strong className="text-white">{pendingItem.name}</strong>
              </span>

              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-[#E1FB15] transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 rounded-xl bg-[#E1FB15] px-3 py-1.5 text-xs font-extrabold text-black hover:bg-[#c9e20e] transition active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Desfazer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
