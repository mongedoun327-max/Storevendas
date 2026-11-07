import React, { useState } from 'react';
import { UserPlus, X, Check, Building2, Phone, Mail, FileText } from 'lucide-react';
import { Customer } from '../../types';

interface PosQuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomer: (customer: Customer) => void;
}

export const PosQuickCustomerModal: React.FC<PosQuickCustomerModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomer,
}) => {
  const [name, setName] = useState('');
  const [nifOrBi, setNifOrBi] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Luanda');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, introduza o nome do cliente ou empresa.');
      return;
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      nifOrBi: nifOrBi.trim() || '999999999',
      phone: phone.trim() || '+244 9XX XXX XXX',
      email: email.trim() || 'cliente@masakula.ao',
      city: city.trim() || 'Luanda',
      totalOrders: 0,
      totalSpent: 0,
      status: 'active',
      lastPurchaseDate: new Date().toISOString(),
    };

    onSaveCustomer(newCustomer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm text-zinc-950">Novo Cliente Rápido</h3>
              <p className="text-[11px] text-zinc-400">Registo rápido para emissão de fatura personalizada</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-bold text-zinc-700 block mb-1">Nome Completo / Razão Social *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: João Manuel ou Empresa ABC, Lda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-zinc-700 block mb-1">NIF ou BI (Angola)</label>
              <input
                type="text"
                placeholder="Ex: 5417082910"
                value={nifOrBi}
                onChange={(e) => setNifOrBi(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 block mb-1">Telefone WhatsApp</label>
              <input
                type="tel"
                placeholder="Ex: 923 000 111"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-zinc-700 block mb-1">E-mail</label>
              <input
                type="email"
                placeholder="cliente@email.ao"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 block mb-1">Cidade / Província</label>
              <input
                type="text"
                placeholder="Luanda, Benguela..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950 font-medium"
              />
            </div>
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
              className="px-5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-black flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Check size={14} />
              <span>Guardar & Selecionar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
