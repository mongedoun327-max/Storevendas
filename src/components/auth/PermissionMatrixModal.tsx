import React from 'react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Eye, 
  XCircle, 
  KeyRound, 
  Lock, 
  UserCheck, 
  Store, 
  Wallet, 
  Boxes, 
  DollarSign, 
  RotateCcw, 
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth, UserRole } from '../../contexts/AuthContext';

interface PermissionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole?: (role: UserRole) => void;
}

export interface PermissionRule {
  module: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  caixaStatus: 'LIVRE' | 'LEITURA' | 'SENHA_GERENTE' | 'NEGADO';
  caixaLabel: string;
  gerenteStatus: 'TOTAL' | 'LIVRE';
  gerenteLabel: string;
  description: string;
}

export const PERMISSION_MATRIX: PermissionRule[] = [
  {
    module: 'Ponto de Venda (PDV)',
    category: 'Vendas & Frente de Caixa',
    icon: Store,
    caixaStatus: 'LIVRE',
    caixaLabel: 'Livre',
    gerenteStatus: 'LIVRE',
    gerenteLabel: 'Livre',
    description: 'Emissão de faturas, leitura de código de barras, aplicação de descontos e recebimentos Multicaixa/Numerário.'
  },
  {
    module: 'Abertura & Fechamento do Próprio Caixa',
    category: 'Sessão de Caixa',
    icon: Wallet,
    caixaStatus: 'LIVRE',
    caixaLabel: 'Livre',
    gerenteStatus: 'LIVRE',
    gerenteLabel: 'Livre',
    description: 'Abertura de turno com fundo de troco, registo de suprimentos/sangrias e conferência cega no fecho.'
  },
  {
    module: 'Consulta de Estoque',
    category: 'Gestão de Estoque',
    icon: Eye,
    caixaStatus: 'LEITURA',
    caixaLabel: '👁️ Apenas Leitura',
    gerenteStatus: 'TOTAL',
    gerenteLabel: 'Controle total',
    description: 'Pesquisa de artigos, verificação de quantidades disponíveis, localização e lotes sem poder editar preços.'
  },
  {
    module: 'Entrada / Ajuste de Estoque & Preços',
    category: 'Gestão de Estoque',
    icon: Boxes,
    caixaStatus: 'NEGADO',
    caixaLabel: 'Acesso negado',
    gerenteStatus: 'TOTAL',
    gerenteLabel: 'Permissão total',
    description: 'Cadastro de novos produtos, alteração de tabela de preços de venda, entrada de fornecedores e acertos de inventário.'
  },
  {
    module: 'Gestão de Despesas & Contas a Pagar',
    category: 'Financeiro',
    icon: DollarSign,
    caixaStatus: 'NEGADO',
    caixaLabel: 'Acesso negado',
    gerenteStatus: 'TOTAL',
    gerenteLabel: 'Permissão total',
    description: 'Lançamento de despesas operacionais, pagamentos de fornecedores e visualização do fluxo de saídas financeiras.'
  },
  {
    module: 'Cancelamento / Estorno de Vendas',
    category: 'Auditoria & Fiscal',
    icon: RotateCcw,
    caixaStatus: 'SENHA_GERENTE',
    caixaLabel: '⚠️ Requer Senha Gerente',
    gerenteStatus: 'TOTAL',
    gerenteLabel: 'Permissão total',
    description: 'Anulação de faturas emitidas e devolução de itens ao estoque. O Caixa necessita de autorização com PIN/Senha do Gerente.'
  },
  {
    module: 'Gestão de Usuários & Operadores',
    category: 'Administração do Sistema',
    icon: Users,
    caixaStatus: 'NEGADO',
    caixaLabel: 'Acesso negado',
    gerenteStatus: 'TOTAL',
    gerenteLabel: 'Permissão total',
    description: 'Criação e edição de contas de operadores, definição de perfis de acesso e auditoria de terminais.'
  }
];

export const PermissionMatrixModal: React.FC<PermissionMatrixModalProps> = ({
  isOpen,
  onClose,
  onSelectRole
}) => {
  const { profile, switchRole } = useAuth();

  if (!isOpen) return null;

  const currentRole = profile?.role || 'GERENTE';

  return (
    <div 
      id="permission-matrix-modal-backdrop"
      className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div 
        id="permission-matrix-card"
        className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 my-auto text-xs animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-md">
              <ShieldCheck size={24} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-zinc-950">Matriz de Níveis de Acesso e Permissões</h2>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold">
                  Masakula ERP v1.0
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Políticas de segurança, separação de funções e controle operacional (Gerente vs. Caixa)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Fechar Janela [ESC]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Role Switcher Banner */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-[11px] text-zinc-600">
              Perfil de demonstração usado pela interface:
            </div>
            <div className={`px-3 py-1 rounded-full font-black text-xs flex items-center gap-1.5 ${
              currentRole === 'GERENTE' 
                ? 'bg-zinc-950 text-white shadow-xs' 
                : 'bg-blue-600 text-white shadow-xs'
            }`}>
              <UserCheck size={14} />
              <span>{currentRole === 'GERENTE' ? 'GERENTE (Controle Total)' : 'CAIXA (Operador Frente de Loja)'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">Mudar perfil de demonstração:</span>
            <button
              type="button"
              aria-pressed={currentRole === 'GERENTE'}
              onClick={() => {
                switchRole('GERENTE');
                if (onSelectRole) onSelectRole('GERENTE');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                currentRole === 'GERENTE'
                  ? 'bg-zinc-900 text-white shadow-xs ring-2 ring-zinc-900/20'
                  : 'bg-white border border-gray-200 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Perfil gerente
            </button>
            <button
              type="button"
              aria-pressed={currentRole === 'CAIXA'}
              onClick={() => {
                switchRole('CAIXA');
                if (onSelectRole) onSelectRole('CAIXA');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                currentRole === 'CAIXA'
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/20'
                  : 'bg-white border border-gray-200 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Perfil caixa
            </button>
          </div>
        </div>

        {/* Permission Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-900 text-white text-[11px] uppercase tracking-wider font-extrabold">
                <th className="py-3 px-4 rounded-tl-2xl">Funcionalidade / Módulo</th>
                <th className="py-3 px-4 w-44 text-center bg-zinc-800 border-x border-zinc-700">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Caixa</span>
                  </div>
                </th>
                <th className="py-3 px-4 w-44 text-center bg-zinc-950">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Gerente</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-zinc-800">
              {PERMISSION_MATRIX.map((item, index) => {
                const Icon = item.icon;
                return (
                  <tr key={index} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-950 text-xs flex items-center gap-2">
                            <span>{item.module}</span>
                            <span className="text-[9px] font-semibold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Caixa Column */}
                    <td className="py-3 px-4 text-center bg-zinc-50/40 border-x border-gray-100">
                      <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] shadow-2xs ${
                        item.caixaStatus === 'LIVRE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.caixaStatus === 'LEITURA'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : item.caixaStatus === 'SENHA_GERENTE'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {item.caixaLabel}
                      </span>
                    </td>

                    {/* Gerente Column */}
                    <td className="py-3 px-4 text-center bg-zinc-50/20">
                      <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                        {item.gerenteLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend & Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span className="text-emerald-900 font-medium"><strong>Livre / Total:</strong> Acesso irrestrito a todas as ações.</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center gap-2">
            <Eye size={15} className="text-blue-600 shrink-0" />
            <span className="text-blue-900 font-medium"><strong>Apenas Leitura:</strong> Consulta permitida sem edição.</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-2">
            <KeyRound size={15} className="text-amber-600 shrink-0" />
            <span className="text-amber-900 font-medium"><strong>Requer Senha:</strong> Necessita PIN do Gerente.</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/80 flex items-center gap-2">
            <XCircle size={15} className="text-rose-600 shrink-0" />
            <span className="text-rose-900 font-medium"><strong>Negado:</strong> Módulo ou ação bloqueada.</span>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Entendido & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
