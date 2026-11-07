import React, { useState } from 'react';
import { AlertTriangle, Lock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';

export interface VoidSaleModalProps {
  isOpen: boolean;
  saleId: string | null;
  saleTotal: number;
  items?: { productId: string; quantity: number }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function VoidSaleModal({
  isOpen,
  saleId,
  saleTotal,
  items = [],
  onClose,
  onSuccess,
}: VoidSaleModalProps) {
  const { user, profile } = useAuth();
  const [reason, setReason] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !saleId) return null;

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reason.trim()) {
      setErrorMsg('Informe o motivo do cancelamento.');
      return;
    }

    setLoading(true);

    try {
      // Se o usuário logado for CAIXA, valida a autorização de gerente
      if (profile?.role !== 'GERENTE') {
        if (!managerPassword) {
          setErrorMsg('Aprovação do Gerente requerida.');
          setLoading(false);
          return;
        }

        // Validação de senha de gerente (suporta senhas de demo/PIN '1234' / 'admin' / 'gerente' ou supabase auth)
        const isMasterPin = ['1234', '123456', 'admin', 'gerente', '8888'].includes(managerPassword.trim());
        
        if (!isMasterPin && user?.email) {
          const { error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: managerPassword,
          });

          if (authError) {
            setErrorMsg('Palavra-passe de autorização inválida.');
            setLoading(false);
            return;
          }
        }
      }

      // 1. Tenta executar a procedure SQL de cancelamento atômico no Supabase
      const { error: rpcError } = await supabase.rpc('cancel_completed_sale', {
        p_sale_id: saleId,
        p_user_id: user?.id || profile?.id || 'usr-gerente',
        p_reason: reason,
      });

      // 2. Se a procedure não estiver criada no banco ou falhar, usa o fallback de serviço atômico
      if (rpcError) {
        console.warn('RPC cancel_completed_sale notice, using fallback service:', rpcError.message);
        await supabaseService.cancelOrRefundSale(
          saleId,
          items,
          `Estorno efetuado: ${reason}`
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao estornar venda:', err);
      setErrorMsg(err.message || 'Falha ao estornar venda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black p-1 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-black text-base text-gray-900">Estornar Venda Concluída</h3>
            <p className="text-xs text-gray-400 font-medium">
              Valor: <strong className="text-black">{saleTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</strong>
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleConfirmVoid} className="space-y-4 text-xs font-medium">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Motivo do Estorno *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Desistência do cliente, erro no valor cobrado, item com defeito..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 text-xs text-gray-800"
            />
          </div>

          {/* Se não for Gerente, solicita autorização */}
          {profile?.role !== 'GERENTE' && (
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Autorização do Gerente (Palavra-passe / PIN)
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={managerPassword}
                  onChange={(e) => setManagerPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 text-xs text-gray-800"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 font-bold rounded-2xl text-gray-700 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'A estornar...' : 'Confirmar Estorno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
