import React, { useState } from 'react';
import { 
  ShieldAlert, 
  KeyRound, 
  Eye, 
  EyeOff, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ManagerAuthModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ManagerAuthModal: React.FC<ManagerAuthModalProps> = ({
  isOpen,
  title = 'Autorização de Gerência Obrigatória',
  description = 'Esta operação de estorno/cancelamento requer validação com a senha de um Gerente.',
  onSuccess,
  onCancel
}) => {
  const { verifyManagerPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      const isValid = verifyManagerPassword(password);
      if (isValid) {
        setPassword('');
        onSuccess();
      } else {
        setError('Senha de Gerente incorreta. Tente novamente ou use a senha padrão: admin2026');
      }
    }, 400);
  };

  const handleFillDemo = () => {
    setPassword('admin2026');
    setError(null);
  };

  return (
    <div 
      id="manager-auth-modal-backdrop"
      className="fixed inset-0 z-50 bg-zinc-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div 
        id="manager-auth-card"
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 text-xs animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-950">{title}</h3>
              <p className="text-[11px] text-zinc-500">
                Regra da Matriz de Permissões AGT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Informative message */}
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs space-y-1">
          <p className="font-semibold">{description}</p>
          <p className="text-[11px] text-amber-700">
            Conforme a matriz de acesso, operadores com perfil <strong>CAIXA</strong> necessitam da confirmação presencial do Gerente para efetuar estornos fiscais.
          </p>
        </div>

        {/* Error notice */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-zinc-800 flex items-center gap-1.5">
                <KeyRound size={13} className="text-zinc-500" />
                <span>Senha do Gerente Responsável</span>
              </label>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[10px] text-blue-600 hover:underline font-semibold"
              >
                Preencher padrão (admin2026)
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduza a senha de Gerente..."
                className="w-full px-3.5 py-3 pr-10 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-2xl border border-gray-200 text-zinc-700 hover:bg-zinc-50 font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isVerifying || !password.trim()}
              className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              {isVerifying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>A Validar...</span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-amber-400" />
                  <span>Autorizar Estorno</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
