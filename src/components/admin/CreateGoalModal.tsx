import React, { useState } from 'react';
import { X, Target, Check } from 'lucide-react';

export interface GoalAttendantOption {
  id: string;
  name: string;
}

export interface NewGoalDTO {
  title: string;
  type: 'SALES' | 'PROFIT' | 'BOTH';
  attendantId: string;
  targetAmount: number;
  dueDate: string;
  notes?: string;
}

interface CreateGoalModalProps {
  attendants: GoalAttendantOption[];
  onClose: () => void;
  onSuccess: (goal: NewGoalDTO) => void;
}

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  attendants,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<NewGoalDTO>({
    title: '',
    type: 'BOTH',
    attendantId: 'TODOS',
    targetAmount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.targetAmount <= 0) {
      return;
    }
    onSuccess(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#131313] text-white">
              <Target size={18} className="text-[#E1FB15]" />
            </div>
            <h3 className="font-bold text-base text-zinc-950">Criar Nova Meta</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-zinc-700 block mb-1">Nome da Meta *</label>
            <input
              type="text"
              required
              placeholder="Ex: Meta de Faturamento Mensal"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Valor Alvo (Kz) *</label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={formData.targetAmount || ''}
                onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0 Kz"
                className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Tipo de Meta</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as NewGoalDTO['type'] })}
                className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
              >
                <option value="BOTH">Faturamento & Lucro</option>
                <option value="SALES">Apenas Faturamento</option>
                <option value="PROFIT">Apenas Lucro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Atendente</label>
              <select
                value={formData.attendantId}
                onChange={(e) => setFormData({ ...formData, attendantId: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
              >
                <option value="TODOS">Todas as Atendentes</option>
                {attendants.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Data Limite *</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-zinc-700 block mb-1">Observações</label>
            <textarea
              rows={2}
              placeholder="Detalhes adicionais sobre esta meta..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 resize-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#131313] hover:bg-black text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} className="text-[#E1FB15]" />
              <span>Criar Meta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGoalModal;
