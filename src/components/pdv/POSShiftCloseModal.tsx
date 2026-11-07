"use client";

import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { DollarSign, CreditCard, ArrowRightLeft, Lock, AlertTriangle, RefreshCw } from "lucide-react";
import { calculateShiftSummary } from "@/services/shiftService";
import { db } from "@/lib/db/posDatabase";
import { syncPendingSalesBatch } from "@/services/offlineSyncService";
import type { PaymentBreakdown, ShiftSummary } from "@/types/shift";

interface POSShiftCloseModalProps {
  shiftId: string;
  operatorName: string;
  openedAt: string;
  openingFloat: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirmClose: (summary: ShiftSummary) => void;
}

export function POSShiftCloseModal({
  shiftId,
  operatorName,
  openedAt,
  openingFloat,
  isOpen,
  onClose,
  onConfirmClose,
}: POSShiftCloseModalProps) {
  const [declared, setDeclared] = useState<PaymentBreakdown>({
    numerario: 0,
    multicaixa: 0,
    transferencia: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const pendingSalesCount = useLiveQuery(
    () => db.pendingSales.where("synced").equals(0).count(),
    [],
    0
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOpen) return null;

  const handleInputChange = (
    field: keyof Omit<PaymentBreakdown, "total">,
    value: number
  ) => {
    const updated = { ...declared, [field]: value };
    updated.total = updated.numerario + updated.multicaixa + updated.transferencia;
    setDeclared(updated);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const summary = await calculateShiftSummary(
        shiftId,
        operatorName,
        openedAt,
        openingFloat,
        declared
      );
      onConfirmClose(summary);
    } catch (error) {
      console.error("Erro ao calcular fecho de caixa:", error);
      window.alert("Erro ao calcular fecho de caixa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#131313] p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E1FB15]/10 text-[#E1FB15]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">Fecho de Caixa (Relatório Z)</h2>
              <p className="text-xs text-gray-400">Insira os valores apurados no fecho do turno</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {pendingSalesCount > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#E1FB15]/30 bg-[#E1FB15]/10 p-3.5 text-xs text-[#E1FB15]">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Existem <strong>{pendingSalesCount} vendas offline</strong> pendentes no equipamento.
                </span>
              </div>

              {isOnline && (
                <button
                  type="button"
                  onClick={() => void syncPendingSalesBatch()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#E1FB15] px-3 py-1.5 text-xs font-extrabold text-black transition hover:bg-[#c9e20e]"
                >
                  <RefreshCw className="h-3 w-3" />
                  Sincronizar Agora
                </button>
              )}
            </div>
          )}

          {[
            {
              field: "numerario" as const,
              label: "Total em Numerário (Gavetão + Fundo Inicial)",
              icon: DollarSign,
            },
            {
              field: "multicaixa" as const,
              label: "Total em Multicaixa (Talões TPA)",
              icon: CreditCard,
            },
            {
              field: "transferencia" as const,
              label: "Total em Transferências (Extrato/Comprovativos)",
              icon: ArrowRightLeft,
            },
          ].map(({ field, label, icon: Icon }) => (
            <div key={field}>
              <label className="mb-1.5 block text-xs font-bold text-gray-300">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={declared[field] || ""}
                  onChange={(event) => handleInputChange(field, parseFloat(event.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-white/10 bg-[#181818] py-2.5 pl-10 pr-12 text-sm font-bold text-white focus:border-[#32D583] focus:outline-none"
                  required
                />
                <span className="absolute right-3.5 top-3 text-xs font-extrabold text-gray-500">Kz</span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#181818] p-3 text-xs">
            <span className="font-bold text-gray-400">Total Apurado Declarado:</span>
            <span className="text-sm font-extrabold text-[#E1FB15]">{declared.total.toLocaleString("pt-AO")} Kz</span>
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
              disabled={isLoading || (pendingSalesCount > 0 && !isOnline)}
              className="w-1/2 rounded-2xl bg-[#32D583] py-3 text-xs font-extrabold text-black transition hover:bg-[#28c072] disabled:opacity-50"
            >
              {pendingSalesCount > 0 && !isOnline
                ? "Ligue à Internet para Sincronizar e Fechar"
                : isLoading
                  ? "A Calcular..."
                  : "Confirmar & Gerar Relatório Z"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
