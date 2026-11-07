"use client";

import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflineFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#131313] p-6 text-center text-white">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400">
        <WifiOff className="h-10 w-10 animate-pulse" />
      </div>

      <h1 className="text-2xl font-black tracking-wider text-white">Modo Offline Ativo</h1>
      <p className="mt-2 max-w-md text-sm text-gray-400">
        A página solicitada ainda não foi descarregada para o seu equipamento. O terminal de vendas principal continua a funcionar normalmente através da memória local.
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-8 flex items-center gap-2 rounded-2xl bg-[#E1FB15] px-6 py-3 text-xs font-extrabold text-black transition hover:bg-[#c9e20e] active:scale-95"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar Novamente
      </button>
    </div>
  );
}
