"use client";

import React, { useState } from "react";
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  ShieldCheck, 
  X, 
  Loader2, 
  DollarSign, 
  FileText, 
  Lock
} from "lucide-react";
import { MovementType } from "@/types/shift";

interface CashMovementModalProps {
  shiftId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CashMovementModal({ shiftId, onClose, onSuccess }: CashMovementModalProps) {
  const [type, setType] = useState<MovementType>("SANGRIA");
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Valores pré-definidos para agilizar a operação no caixa
  const quickAmounts = [2000, 5000, 10000, 20000, 50000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg("Insira um valor válido maior que zero.");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Informe a justificativa/motivo do movimento.");
      return;
    }

    if (pin.length < 4) {
      setErrorMsg("O PIN de autorização deve ter 4 dígitos.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/shifts/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id: shiftId,
          type,
          amount: numericAmount,
          reason: reason.trim(),
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar a movimentação.");
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              type === "SANGRIA" 
                ? "bg-rose-50 text-rose-600 border border-rose-200" 
                : "bg-emerald-50 text-emerald-600 border border-emerald-200"
            }`}>
              {type === "SANGRIA" ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">Movimento de Caixa</h3>
              <p className="text-[11px] text-zinc-500">Registo imediato no diário de caixa</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-xl bg-zinc-100 border border-zinc-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SELETOR SANGRIA / REFORÇO */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200 mb-5">
          <button
            type="button"
            onClick={() => setType("SANGRIA")}
            className={`py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              type === "SANGRIA"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Sangria (Retirada)</span>
          </button>

          <button
            type="button"
            onClick={() => setType("REFORCO")}
            className={`py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              type === "REFORCO"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Reforço (Suprimento)</span>
          </button>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* VALOR */}
          <div>
            <label className="text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
              Valor da Operação (Kz)
            </label>
            <input
              type="number"
              step="100"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-xl p-3.5 text-lg font-mono font-black text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/15 transition"
            />

            {/* BOTÕES DE VALOR RÁPIDO */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {quickAmounts.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v.toString())}
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg text-[10px] font-mono font-bold text-zinc-700 transition cursor-pointer shrink-0"
                >
                  +{v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* MOTIVO / JUSTIFICATIVA */}
          <div>
            <label className="text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Motivo / Observação
            </label>
            <input
              type="text"
              required
              placeholder={type === "SANGRIA" ? "Ex: Depósito de segurança no cofre" : "Ex: Troco inicial extra"}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900/15 transition"
            />
          </div>

          {/* AUTORIZAÇÃO POR PIN */}
          <div>
            <label className="text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              PIN de Autorização (Operador/Supervisor)
            </label>
            <input
              type="password"
              maxLength={4}
              required
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-xl p-3 text-center text-base tracking-[0.5em] font-mono font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/15 transition"
            />
          </div>

          {/* ERRO */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* BOTÃO DE CONFIRMAÇÃO */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-2 cursor-pointer ${
              type === "SANGRIA"
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
            } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Confirmar {type === "SANGRIA" ? "Sangria" : "Reforço"}</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

export default CashMovementModal;
