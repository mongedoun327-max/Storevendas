"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CreditCard, Banknote, QrCode, CheckCircle2, Loader2 } from "lucide-react";
import { PaymentMethod } from "@/types/pos";

interface POSCheckoutModalProps {
  isOpen: boolean;
  totalAmount: number;
  onClose: () => void;
  onConfirmSale: (paymentMethod: PaymentMethod, amountPaid: number, change: number) => Promise<void>;
}

export function POSCheckoutModal({
  isOpen,
  totalAmount,
  onClose,
  onConfirmSale,
}: POSCheckoutModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("MULTICAIXA");
  const [amountPaid, setAmountPaid] = useState<string>(totalAmount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericPaid = parseFloat(amountPaid) || 0;
  const change = Math.max(0, numericPaid - totalAmount);

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);
      await onConfirmSale(method, numericPaid, change);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#131313] p-6 text-white shadow-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/5 p-1.5 text-gray-400 hover:text-white"
            aria-label="Fechar checkout"
          >
            <X className="h-4 w-4" />
          </button>

          <h3 className="text-lg font-bold">Finalizar Venda</h3>
          <p className="mb-5 text-xs text-gray-400">Escolha o método de pagamento</p>

          <div className="mb-5 grid grid-cols-3 gap-2.5">
            {[
              { id: "MULTICAIXA", label: "TPA / Express", icon: CreditCard },
              { id: "CASH", label: "Numerário", icon: Banknote },
              { id: "TRANSFER", label: "Transferência", icon: QrCode },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  const selectedMethod = id as PaymentMethod;
                  setMethod(selectedMethod);
                  if (selectedMethod === "MULTICAIXA" || selectedMethod === "TRANSFER") {
                    setAmountPaid(totalAmount.toString());
                  }
                }}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition ${
                  method === id
                    ? "border-[#32D583] bg-[#32D583]/10 text-[#32D583]"
                    : "border-white/10 bg-[#181818] text-gray-400 hover:border-white/20"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="mb-6 space-y-4 rounded-2xl border border-white/5 bg-[#181818] p-4">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Total da Compra</span>
              <span className="font-mono font-bold text-white">
                {totalAmount.toLocaleString("pt-AO")} Kz
              </span>
            </div>

            {method === "CASH" && (
              <>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-gray-300">
                    Valor Recebido (Kz)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={amountPaid}
                    onChange={(event) => setAmountPaid(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2.5 font-mono text-xs text-white focus:border-[#32D583] focus:outline-none"
                  />
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Troco</span>
                  <span className="font-mono font-bold text-[#E1FB15]">
                    {change.toLocaleString("pt-AO")} Kz
                  </span>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleFinish}
            disabled={isSubmitting || numericPaid < totalAmount}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#32D583] py-3.5 text-xs font-extrabold text-black transition hover:bg-[#28c072] disabled:opacity-40"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-black" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirmar e Emitir Recibo</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
