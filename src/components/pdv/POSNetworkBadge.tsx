"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wifi, WifiOff, RefreshCw, CloudUpload, Check } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export function POSNetworkBadge() {
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#131313] px-3.5 py-2 text-xs text-white shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 border-r border-white/10 pr-2">
        <div className="relative flex h-2.5 w-2.5 items-center justify-center">
          {isOnline ? (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#32D583] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#32D583]" />
            </>
          ) : (
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          )}
        </div>

        <div className="flex items-center gap-1.5 font-bold">
          {isOnline ? (
            <Wifi className="h-3.5 w-3.5 text-[#32D583]" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-rose-500" />
          )}
          <span className={`text-[11px] uppercase tracking-wider ${isOnline ? "text-gray-300" : "text-rose-400"}`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {pendingCount > 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-1.5 rounded-xl border border-[#E1FB15]/20 bg-[#E1FB15]/10 px-2.5 py-1 text-[11px] font-extrabold text-[#E1FB15]">
              <CloudUpload className="h-3.5 w-3.5" />
              <span>{pendingCount} {pendingCount === 1 ? "venda pendente" : "vendas pendentes"}</span>
            </div>

            <button
              type="button"
              onClick={() => void triggerSync()}
              disabled={!isOnline || isSyncing}
              title={isOnline ? "Sincronizar vendas com a nuvem agora" : "Sem ligação à internet para sincronizar"}
              aria-label={isOnline ? "Sincronizar vendas pendentes" : "Sincronização indisponível offline"}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#181818] px-2.5 py-1 text-[11px] font-bold text-white transition hover:border-[#32D583] hover:text-[#32D583] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-[#32D583]" : ""}`} />
              <span>{isSyncing ? "A Sincronizar..." : "Sincronizar"}</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400"
          >
            <Check className="h-3.5 w-3.5 text-[#32D583]" />
            <span>Tudo Sincronizado</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
