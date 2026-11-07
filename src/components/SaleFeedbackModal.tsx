import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';

export interface SaleFeedbackModalProps {
  type: 'SUCCESS' | 'CANCELED' | null;
  isOpen: boolean;
  totalAmount: number;
  changeAmount?: number;
  onPrintReceipt?: () => void;
  onClose: () => void;
}

export default function SaleFeedbackModal({
  type,
  isOpen,
  totalAmount,
  changeAmount = 0,
  onPrintReceipt,
  onClose
}: SaleFeedbackModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Enter' || e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !type) return null;

  const isSuccess = type === 'SUCCESS';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-[var(--line)] flex flex-col items-center space-y-6 relative">
        
        {/* Botão de Fechar no topo */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-50 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Ilustração do Sacola */}
        <div className="relative">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-transform ${
              isSuccess ? 'bg-[#e7f6f0]' : 'bg-[#fde8ed]'
            }`}
          >
            {isSuccess ? (
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 22V16a12 12 0 0 1 24 0v6" />
                <rect x="14" y="22" width="36" height="34" rx="8" fill="white" />
                <circle cx="25" cy="32" r="2" fill="#111111" stroke="none" />
                <circle cx="39" cy="32" r="2" fill="#111111" stroke="none" />
                <path d="M24 42c3 4 13 4 16 0" strokeWidth="3.5" />
              </svg>
            ) : (
              <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 22V16a12 12 0 0 1 24 0v6" />
                <rect x="14" y="22" width="36" height="34" rx="8" fill="white" />
                <circle cx="25" cy="32" r="2" fill="#111111" stroke="none" />
                <circle cx="39" cy="32" r="2" fill="#111111" stroke="none" />
                <path d="M24 44c3-4 13-4 16 0" strokeWidth="3.5" />
              </svg>
            )}
          </div>

          <div
            className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-white shadow-xs ${
              isSuccess ? 'bg-[#0b7a54]' : 'bg-[#c8002f]'
            }`}
          >
            {isSuccess ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
          </div>
        </div>

        {/* Textos e Valores */}
        {isSuccess ? (
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#111111] tracking-tight">Venda finalizada com sucesso!</h2>
            <p className="text-3xl font-bold text-[#111111]" data-numeric="true">
              {totalAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
            </p>
            {changeAmount > 0 && (
              <p className="text-xs font-semibold text-[var(--text-secondary)] pt-1" data-numeric="true">
                Troco a devolver: {changeAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#c8002f] tracking-tight">Atendimento cancelado</h2>
            <p className="text-2xl font-bold text-[#111111]" data-numeric="true">
              {totalAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
            </p>
            <p className="text-xs font-medium text-[var(--text-secondary)] pt-1">O caixa está pronto para uma nova venda.</p>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="w-full flex flex-col gap-2 pt-2">
          {isSuccess && onPrintReceipt && (
            <button
              type="button"
              onClick={onPrintReceipt}
              className="btn--secondary w-full cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Imprimir talão de venda</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn--primary w-full cursor-pointer"
          >
            {isSuccess ? 'Concluir (Pressione Enter)' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
}
