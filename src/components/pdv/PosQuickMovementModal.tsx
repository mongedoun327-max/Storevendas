import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Coins, X, Check, Lock } from 'lucide-react';
import { formatKz } from '../../utils/formatters';

interface PosQuickMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitMovement: (type: 'SANGRIA' | 'SUPRIMENTO', amount: number, reason: string) => void;
}

export const PosQuickMovementModal: React.FC<PosQuickMovementModalProps> = ({
  isOpen,
  onClose,
  onSubmitMovement,
}) => {
  const [type, setType] = useState<'SANGRIA' | 'SUPRIMENTO'>('SANGRIA');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickAmounts = [2000, 5000, 10000, 20000, 50000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError('Insira um montante válido maior que 0 Kz.');
      return;
    }
    if (!reason.trim()) {
      setError('Descreva a justificativa para este movimento de caixa.');
      return;
    }

    onSubmitMovement(type, num, reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
              <Coins size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-sm text-zinc-950">Movimento Rápido de Gaveta</h3>
              <p className="text-[11px] text-zinc-400">Sangria (retirada) ou Suprimento (troco inicial)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
            {error}
          </div>
        )}

        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('SANGRIA')}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-black transition-all ${
              type === 'SANGRIA'
                ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <ArrowDownRight size={16} />
            <span>Sangria (Saída)</span>
          </button>

          <button
            type="button"
            onClick={() => setType('SUPRIMENTO')}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-black transition-all ${
              type === 'SUPRIMENTO'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <ArrowUpRight size={16} />
            <span>Suprimento (Entrada)</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-bold text-zinc-700 block mb-1">Montante em Kwanzas (Kz) *</label>
            <input
              type="number"
              required
              autoFocus
              placeholder="Ex: 10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 font-black text-base text-zinc-950"
            />
          </div>

          {/* Quick Amount Pills */}
          <div className="flex flex-wrap gap-1.5">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(String(amt))}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-[11px] transition-colors"
              >
                +{formatKz(amt)}
              </button>
            ))}
          </div>

          <div>
            <label className="font-bold text-zinc-700 block mb-1">Motivo / Justificativa *</label>
            <input
              type="text"
              required
              placeholder={type === 'SANGRIA' ? 'Ex: Recolha de segurança para cofre' : 'Ex: Entrada de troco em notas miúdas'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl font-black text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer ${
                type === 'SANGRIA' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Check size={14} />
              <span>Registar {type === 'SANGRIA' ? 'Sangria' : 'Suprimento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
