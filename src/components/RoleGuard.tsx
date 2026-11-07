import React, { useState } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { ShieldAlert, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { PermissionMatrixModal } from './auth/PermissionMatrixModal';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  moduleName?: string;
  actionName?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallback,
  moduleName = 'este módulo',
  actionName
}) => {
  const { profile, loading, hasRole, switchRole } = useAuth();
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400 font-medium">
        <span className="inline-block w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mr-2" />
        A verificar permissões e credenciais de acesso...
      </div>
    );
  }

  if (!hasRole(allowedRoles)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const currentRoleLabel = profile?.role === 'CAIXA' ? 'Operador de Caixa' : profile?.role || 'Não autenticado';

    return (
      <>
        <div 
          id="access-restricted-card"
          className="p-8 max-w-lg mx-auto my-8 bg-white rounded-3xl border border-gray-100 shadow-xl text-center space-y-4 animate-in fade-in"
        >
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={28} />
          </div>

          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase tracking-wider">
              Acesso Negado • Matriz de Segurança
            </span>
            <h3 className="font-extrabold text-base text-zinc-950">
              Permissão Restrita a Gerente
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
              O seu perfil atual (<strong>{currentRoleLabel}</strong>) não possui autorização para aceder a {moduleName}{actionName ? ` para ${actionName}` : ''}.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-gray-200 text-left text-[11px] text-zinc-600 space-y-1">
            <div className="font-bold text-zinc-900 flex items-center gap-1.5">
              <Lock size={13} className="text-amber-500" />
              <span>Regra de Controlo Interno:</span>
            </div>
            <p>
              Conforme a <strong>Matriz de Permissões Masakula</strong>, este módulo exige nível de acesso <strong>GERENTE</strong> para evitar inconsistências fiscais e financeiras.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsMatrixOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Ver Matriz de Acessos</span>
            </button>

            <button
              type="button"
              onClick={() => switchRole('GERENTE')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Alternar p/ Modo Gerente</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <PermissionMatrixModal
          isOpen={isMatrixOpen}
          onClose={() => setIsMatrixOpen(false)}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
