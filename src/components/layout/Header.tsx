import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  ShoppingCart, 
  Wrench, 
  Package, 
  CircleDollarSign, 
  HelpCircle,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  User,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { ActiveTab, NavigationTab, UserSession } from '../../types';
import { formatKz } from '../../utils/formatters';
import { NotificationsCenter } from '../NotificationsCenter';
import { PWAInstallButton } from '../pdv/PWAInstallButton';
import { subscribeToSyncQueue } from '../../services/syncQueue';
import { getLastSyncTime } from '../../services/syncEngine';

interface HeaderProps {
  activeTab: ActiveTab | NavigationTab;
  setActiveTab: (tab: any) => void;
  onOpenQuickSale?: () => void;
  onOpenQuickOS?: () => void;
  onOpenQuickProduct?: () => void;
  todaySalesTotal?: number;
  lowStockCount?: number;
  openOSCount?: number;
  companyName?: string;
  tradingName?: string;
  userSession?: UserSession;
  onLogout?: () => void;
  isSupabaseSyncing?: boolean;
  supabaseConnected?: boolean;
  onManualSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickSale,
  onOpenQuickOS,
  onOpenQuickProduct,
  todaySalesTotal = 0,
  lowStockCount = 0,
  openOSCount = 0,
  companyName = '',
  tradingName = '',
  userSession,
  onLogout,
  isSupabaseSyncing = false,
  supabaseConnected = false,
  onManualSync,
}) => {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  useEffect(() => {
    return subscribeToSyncQueue((count) => setPendingSyncCount(count));
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getPageInfo = (tab: ActiveTab | NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Painel Geral',
          subtitle: 'Visão executiva e métricas em tempo real em Kwanzas (Kz)',
        };
      case 'sales':
      case 'pos':
        return {
          title: 'Vendas & PDV',
          subtitle: 'Faturação rápida de balcão, caixa e emissão de talões AGT',
        };
      case 'cash_session':
        return {
          title: 'Sessão & Controle de Caixa',
          subtitle: 'Abertura, sangrias, suprimentos de troco e fechamento com apuração de quebra/sobra',
        };
      case 'expenses':
        return {
          title: 'Gestão de Despesas',
          subtitle: 'Controle de saídas, fornecedores e contas a pagar em Kwanzas (Kz)',
        };
      case 'products':
        return {
          title: 'Gestão de Produtos',
          subtitle: 'Catálogo de artigos, controlo de inventário e margens de lucro',
        };
      case 'service_orders':
      case 'services':
        return {
          title: 'Ordens de Serviço',
          subtitle: 'Acompanhamento técnico de reparações, peças e orçamentos em Kz',
        };
      case 'customers':
        return {
          title: 'Clientes',
          subtitle: 'Cadastro de clientes, histórico e conformidade com NIF',
        };
      case 'goals':
        return {
          title: 'Metas',
          subtitle: 'Acompanhamento em tempo real do faturamento e rentabilidade da equipa',
        };
      case 'reports':
        return {
          title: 'Relatórios',
          subtitle: 'Balanço financeiro, mapas de vendas e conformidade fiscal AGT',
        };
      case 'settings':
        return {
          title: 'Configurações',
          subtitle: 'Empresa, parâmetros AGT, moedas (Kz) e preferências do sistema',
        };
      default:
        return { title: 'Masakula ERP', subtitle: 'Gestão comercial em Kz' };
    }
  };

  const pageInfo = getPageInfo(activeTab);

  return (
    <header
      id="masakula-top-header"
      className="sticky top-0 z-30 bg-[#fcfcfc]/90 backdrop-blur-md border-b border-gray-100 px-6 py-3.5 transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Company context and single page title */}
        <div className="flex flex-col">
          <div className="flex items-center text-xs font-semibold text-zinc-400">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              title={companyName || tradingName || 'Masakula'}
              className="min-h-8 rounded-md text-left font-bold text-zinc-700 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
            >
              {tradingName || companyName || 'Masakula'}
            </button>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight">
              {pageInfo.title}
            </h1>
            {activeTab === 'pos' && (
              <span className="text-xs font-semibold text-[#0b7a54]">
                Caixa aberta
              </span>
            )}
          </div>
        </div>

        {/* Center/Right Actions & Telemetria Silenciosa */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Indicador de Vendas Hoje: Texto plano sem ícones de moeda e sem caixa de botão */}
          {activeTab !== 'dashboard' && (
            <div className="hidden lg:flex items-baseline gap-2">
              <span className="text-xs text-[#5f5f66] font-medium">Vendas hoje:</span>
              <span className="text-sm font-semibold text-[#111111]" data-numeric="true">
                {formatKz(todaySalesTotal)}
              </span>
            </div>
          )}

          {/* Botão de Instalação PWA (100% Offline) */}
          <PWAInstallButton />

          {/* Ação Primária de Topo Única */}
          {activeTab !== 'pos' && activeTab !== 'sales' && (
            <button
              id="btn-quick-pos"
              type="button"
              onClick={() => {
                setActiveTab('pos');
                if (onOpenQuickSale) onOpenQuickSale();
              }}
              className="btn--primary"
            >
              <span>Abrir PDV</span>
            </button>
          )}

          {/* Indicador de Conectividade & Sincronização em Tempo Real */}
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border bg-amber-50 text-amber-800 border-amber-200"
                title="A trabalhar 100% offline. Todos os dados estão protegidos no seu aparelho."
              >
                <WifiOff size={13} className="text-amber-600 shrink-0" />
                <span>Modo offline</span>
                {pendingSyncCount > 0 && (
                  <span className="font-bold text-[11px] bg-amber-200/80 px-1.5 py-0.2 rounded font-mono">
                    {pendingSyncCount} pendentes
                  </span>
                )}
              </div>
            ) : isSupabaseSyncing ? (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border bg-blue-50 text-blue-700 border-blue-200"
                title="Sincronizando dados em tempo real com o servidor central"
              >
                <RefreshCw size={13} className="animate-spin text-blue-600 shrink-0" />
                <span>A sincronizar...</span>
              </div>
            ) : pendingSyncCount > 0 ? (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border bg-amber-50 text-amber-800 border-amber-300"
                title="Alterações feitas offline aguardando envio para o servidor"
              >
                <Wifi size={13} className="text-amber-600 shrink-0" />
                <span>Online • {pendingSyncCount} por enviar</span>
              </div>
            ) : (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border bg-emerald-50 text-emerald-800 border-emerald-200"
                title="Conectado ao servidor. Dados sincronizados em tempo real entre todos os utilizadores."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="font-medium">Em tempo real</span>
              </div>
            )}

            {/* Botão de Sincronização Manual */}
            {onManualSync && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSupabaseSyncing}
                title="Forçar sincronização de dados agora com o servidor"
                className="flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-zinc-700 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={isSupabaseSyncing ? "animate-spin text-emerald-600" : "text-zinc-500"} />
                <span className="hidden sm:inline">Sincronizar</span>
              </button>
            )}
          </div>

          {/* Notificações Operacionais */}
          <NotificationsCenter onNavigateToProducts={() => setActiveTab('products')} />

          {/* Indicador de Utilizador Logado */}
          {userSession && (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="flex flex-col text-right leading-tight">
                <span className="text-xs font-semibold text-zinc-900">
                  {userSession.role.includes('Admin') ? '👑 Admin' : '👤 Atendente'}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {userSession.email}
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Trocar de utilizador / Terminar sessão"
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
