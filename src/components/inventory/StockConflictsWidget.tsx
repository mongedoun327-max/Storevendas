"use client";

import React from "react";
import { useStockConflicts } from "@/hooks/useStockConflicts";
import { AlertOctagon, CheckCircle2, Package, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function StockConflictsWidget() {
  const { conflicts, loading, refresh, resolveConflict } = useStockConflicts();

  if (!loading && conflicts.length === 0) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-white shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 border-b border-rose-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
            <AlertOctagon className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
              Conflitos de Stock Offline ({conflicts.length})
            </h4>
            <p className="text-[11px] text-gray-400">
              Vendas sincronizadas que causaram rutura de stock físico.
            </p>
          </div>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
          title="Atualizar conflitos"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
        <AnimatePresence>
          {conflicts.map((conflict) => {
            const productName = conflict.products?.name || `Artigo #${conflict.product_id.slice(0, 8)}`;
            const currentStock = conflict.products?.stock ?? conflict.available_quantity;
            const barcode = conflict.products?.barcode;

            return (
              <motion.div
                key={conflict.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/10 bg-black/40 p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-rose-400">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">
                      {productName}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      {barcode && <span>EAN: {barcode}</span>}
                      <span>Vendido: {conflict.requested_quantity} un</span>
                      <span className="font-mono text-rose-400 font-bold">
                        Stock atual: {currentStock} un
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => resolveConflict(conflict.id)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-rose-500/20 px-2.5 py-1.5 text-[11px] font-medium text-rose-300 hover:bg-rose-500 hover:text-white transition active:scale-95"
                  title="Marcar como regularizado"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Resolver</span>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
