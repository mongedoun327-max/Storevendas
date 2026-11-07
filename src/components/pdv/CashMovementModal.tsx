"use client";

import React, { useState } from "react";
import { ArrowUpCircle, ArrowDownCircle, DollarSign, FileText, X } from "lucide-react";
import { addCashMovement, type MovementType } from "@/services/cashShiftService";

interface CashMovementModalProps {
  shiftId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CashMovementModal({
  shiftId,
  isOpen,
  onClose,
  onSuccess,
}: CashMovementModalProps) {
  const [type, setType] = useState<MovementType>("sangria");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number.parseFloat(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      window.alert("Por favor, introduza um valor válido superior a zero.");
      return;
    }

    if (!reason.trim()) {
      window.alert("Por favor, especifique o motivo da movimentação.");
      return;
    }

    try {
      setIsLoading(true);
      await addCashMovement({
        shiftId,
        type,
        amount: numericAmount,
        reason: reason.trim(),
      });
      setAmount("");
      setReason("");
      setType("sangria");
      onSuccess?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      window.alert(`Erro ao registar movimentação: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#131313] p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-extrabold">Movimentação de Caixa</h2>
            <p className="text-xs text-gray-400">Registo de entradas e saídas de fundo</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Fechar movimentação de caixa"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-white/5 bg-[#181818] p-1.5">
            <button
              type="button"
              onClick={() => setType("sangria")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${type === "sangria" ? "border border-rose-500/30 bg-rose-500/20 text-rose-400" : "text-gray-400 hover:text-white"}`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              <span>Sangria (Saída)</span>
            </button>
            <button
              type="button"
              onClick={() => setType("suprimento")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${type === "suprimento" ? "border border-[#32D583]/30 bg-[#32D583]/20 text-[#32D583]" : "text-gray-400 hover:text-white"}`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span>Suprimento (Entrada)</span>
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-300">Valor (Kz)</label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border border-white/10 bg-[#181818] py-2.5 pl-10 pr-12 text-sm font-bold text-white focus:border-[#E1FB15] focus:outline-none"
                required
              />
              <span className="absolute right-3.5 top-3 text-xs font-extrabold text-gray-500">Kz</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-300">Motivo / Descrição</label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={type === "sangria" ? "Ex: Retirada para cofre" : "Ex: Reforço de trocos para o turno"}
                className="w-full rounded-2xl border border-white/10 bg-[#181818] py-2.5 pl-10 pr-4 text-xs font-medium text-white focus:border-[#E1FB15] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-1/2 rounded-2xl border border-white/10 bg-[#181818] py-3 text-xs font-bold text-white transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-1/2 rounded-2xl py-3 text-xs font-extrabold transition disabled:opacity-50 ${type === "sangria" ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-[#32D583] text-black hover:bg-[#28c072]"}`}
            >
              {isLoading ? "A gravar..." : `Confirmar ${type === "sangria" ? "Sangria" : "Suprimento"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
