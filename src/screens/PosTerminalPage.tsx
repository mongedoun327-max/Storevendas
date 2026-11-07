"use client";

import React, { useState } from "react";
import { usePosShortcuts } from "@/hooks/usePosShortcuts";
import { Vault, CheckCircle2, AlertCircle } from "lucide-react";

export default function PosTerminalPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const showToast = (msg: string, error: boolean = false) => {
    setIsError(error);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Ativa o atalho global F9
  const { handleOpenDrawer } = usePosShortcuts({
    onOpenDrawerSuccess: () => showToast("Gaveta de dinheiro aberta com sucesso!", false),
    onOpenDrawerError: () => showToast("Erro: Verifique a ligação USB da impressora/gaveta.", true),
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <header className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Terminal Vendas - Masakula ERP</h1>
        
        {/* BOTÃO COM INDICAÇÃO DO ATALHO F9 */}
        <button
          type="button"
          onClick={handleOpenDrawer}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-700 hover:border-emerald-500 rounded-xl text-xs font-semibold text-neutral-200 hover:text-white transition shadow-sm cursor-pointer"
        >
          <Vault className="w-4 h-4 text-emerald-400" />
          <span>Abrir Gaveta</span>
          <kbd className="px-2 py-0.5 bg-neutral-800 text-neutral-400 border border-neutral-700 rounded text-[10px] font-mono">
            F9
          </kbd>
        </button>
      </header>

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-neutral-900 border ${
          isError ? 'border-rose-500/50 text-rose-200' : 'border-emerald-500/50 text-neutral-100'
        } rounded-2xl shadow-2xl text-xs animate-in fade-in slide-in-from-bottom-3`}>
          {isError ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
