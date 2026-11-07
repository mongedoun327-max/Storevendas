import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  ShoppingCart, 
  Coins,
  TrendingDown,
  Users, 
  BarChart3, 
  Settings,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Target
} from 'lucide-react';
import { ActiveTab, NavigationTab, Product, WorkOrder, Customer, SaleTransaction, CompanySettings, UserSession, Expense, CashSession, CashMovement } from '../../types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardView } from '../views/DashboardView';
import { ProductsView } from '../views/ProductsView';
import { ServiceOrdersView } from '../views/ServiceOrdersView';
import { PosView } from '../views/PosView';
import { CashSessionView } from '../views/CashSessionView';
import { ExpensesView } from '../views/ExpensesView';
import { CustomersView } from '../views/CustomersView';
import { GoalsView } from '../views/GoalsView';
import { ReportsView } from '../views/ReportsView';
import { SettingsView } from '../views/SettingsView';
import { ShiftAnalyticsPage } from '../ShiftAnalyticsPage';
import { FloatingTrashCan } from '../ui/FloatingTrashCan';
import { 
  loadStoredProducts, 
  saveStoredProducts, 
  loadStoredWorkOrders, 
  saveStoredWorkOrders,
  loadStoredCustomers, 
  saveStoredCustomers,
  loadStoredSales,
  saveStoredSales,
  loadStoredExpenses,
  saveStoredExpenses,
  loadStoredCashSession,
  saveStoredCashSession,
  loadStoredCashMovements,
  saveStoredCashMovements,
  loadStoredSettings,
  saveStoredSettings,
  resetToBlankSystem,
  reconcileStorageWithIndexedDB,
  requestPersistentStorage
} from '../../utils/storage';
import { supabase } from '../../lib/supabase';
import { supabaseService } from '../../services/supabaseService';
import { syncAllWithSupabase, SYNC_COMPLETE_EVENT } from '../../services/syncEngine';
import { toast } from 'sonner';

interface AppShellProps {
  userSession?: UserSession;
  onLogout?: () => void;
}

export const TAB_METADATA: Record<ActiveTab, {
  title: string;
  subtitle: string;
  statusMessage: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  phase: string;
}> = {
  dashboard: {
    title: 'Painel Geral',
    subtitle: 'Visão executiva e métricas em tempo real em Kwanzas (Kz)',
    statusMessage: 'Módulo ativo. Acompanhe os indicadores chave, faturamento diário e alertas de estoque.',
    icon: LayoutDashboard,
    phase: 'Fase 1 • Ativo',
  },
  products: {
    title: 'Gestão de Produtos',
    subtitle: 'Catálogo de artigos, controle de estoque e margens de lucro em Kwanzas (Kz)',
    statusMessage: 'Módulo pronto. Gerencie o catálogo, código de barras EAN-13, entradas de estoque e preços.',
    icon: Package,
    phase: 'Fase 1 • Operacional',
  },
  service_orders: {
    title: 'Ordens de Serviço',
    subtitle: 'Acompanhamento técnico de reparações, peças e orçamentos em Kwanzas (Kz)',
    statusMessage: 'Módulo pronto. Cadastre ordens de serviço, atribua técnicos e controle estados (Concluído, Em Andamento, Pendente).',
    icon: Wrench,
    phase: 'Fase 1 • Operacional',
  },
  sales: {
    title: 'Vendas & PDV',
    subtitle: 'Faturamento rápido de balcão, caixa e emissão de talões AGT',
    statusMessage: 'Módulo pronto. Frente de caixa ágil, pagamentos múltiplos (TPA, Cash) e emissão de recibos.',
    icon: ShoppingCart,
    phase: 'Fase 1 • Operacional',
  },
  cash_session: {
    title: 'Sessão de Caixa',
    subtitle: 'Abertura, sangrias, suprimentos de troco e fechamento com apuração de quebra/sobra',
    statusMessage: 'Módulo pronto. Controle total do fluxo de gaveta em dinheiro vivo em Kwanzas (Kz).',
    icon: Coins,
    phase: 'Fase 1 • Operacional',
  },
  expenses: {
    title: 'Gestão de Despesas',
    subtitle: 'Controle de saídas, fornecedores e contas a pagar em Kwanzas (Kz)',
    statusMessage: 'Módulo pronto. Lançamento de despesas, contas a pagar, status de liquidação e fornecedores.',
    icon: TrendingDown,
    phase: 'Fase 1 • Operacional',
  },
  customers: {
    title: 'Clientes',
    subtitle: 'Cadastro de clientes particulares e empresas com NIF',
    statusMessage: 'Módulo pronto. Histórico de compras, crédito em conta corrente e conformidade fiscal AGT.',
    icon: Users,
    phase: 'Fase 1 • Operacional',
  },
  goals: {
    title: 'Metas',
    subtitle: 'Acompanhamento em tempo real do faturamento e rentabilidade da equipa',
    statusMessage: 'Módulo pronto. Defina metas de faturamento e lucro e acompanhe o progresso em tempo real.',
    icon: Target,
    phase: 'Fase 1 • Operacional',
  },
  attendance: {
    title: 'Tempo de Atendimento',
    subtitle: 'Carga horária semanal e rendimento por operador de caixa',
    statusMessage: 'Módulo pronto. Acompanhe horas trabalhadas, ranking e eficiência por hora de cada operador.',
    icon: Clock,
    phase: 'Fase 1 • Operacional',
  },
  reports: {
    title: 'Relatórios',
    subtitle: 'Balanço financeiro, mapas de vendas e conformidade fiscal AGT',
    statusMessage: 'Módulo pronto. Análise de desempenho comercial, curva ABC e exportação SAF-T AO.',
    icon: BarChart3,
    phase: 'Fase 1 • Operacional',
  },
  audit: {
    title: 'Auditoria & Quebras',
    subtitle: 'Desempenho de operadores, motivos de divergência e controle de quebras/sobras',
    statusMessage: 'Módulo pronto. Análise de quebras por motivo, impacto financeiro (Kz) e auditoria de caixas.',
    icon: ShieldCheck,
    phase: 'Fase 1 • Auditoria Ativa',
  },
  settings: {
    title: 'Configurações',
    subtitle: 'Empresa, parâmetros AGT, moedas locais (Kz) e preferências do sistema',
    statusMessage: 'Dados da empresa, impressão, acessos, auditoria e cópias de segurança.',
    icon: Settings,
    phase: 'Fase 1 • Operacional',
  },
};

export const AppShell: React.FC<AppShellProps> = ({
  userSession,
  onLogout,
}) => {
  // 3. Gerenciador de estado central (activeTab)
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // RBAC Access Evaluation
  const isAdmin = userSession?.role === 'admin' || 
                  userSession?.role === 'Administrador Master' || 
                  userSession?.role === 'Administrador Geral' || 
                  userSession?.role === 'GERENTE' ||
                  userSession?.email?.toLowerCase().includes('admin');

  // RBAC Guard: If attendant attempts to access restricted tabs, bounce to 'sales'
  useEffect(() => {
    if (!isAdmin) {
      const restrictedTabs: ActiveTab[] = ['reports', 'expenses', 'settings', 'audit'];
      if (restrictedTabs.includes(activeTab)) {
        setActiveTab('sales');
      }
    }
  }, [isAdmin, activeTab]);

  // Application Data States with localStorage Persistence
  const [products, setProducts] = useState<Product[]>(() => loadStoredProducts());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => loadStoredWorkOrders());
  const [customers, setCustomers] = useState<Customer[]>(() => loadStoredCustomers());
  const [sales, setSales] = useState<SaleTransaction[]>(() => loadStoredSales());
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStoredExpenses());
  const [activeCashSession, setActiveCashSession] = useState<CashSession | null>(() => loadStoredCashSession());
  const [cashMovements, setCashMovements] = useState<CashMovement[]>(() => loadStoredCashMovements());
  const [settings, setSettings] = useState<CompanySettings>(() => loadStoredSettings());

  // Database Integrity & Resilience: Solicita armazenamento persistente e reconcilia com IndexedDB
  useEffect(() => {
    try {
      requestPersistentStorage().catch(() => {});
      localStorage.setItem('masakula_clean_slate_session_v7', 'done');

      // Se o localStorage estiver vazio de produtos ou vendas, resgata do IndexedDB
      reconcileStorageWithIndexedDB().then((res) => {
        if (res.recoveredProducts > 0) {
          const restored = loadStoredProducts();
          if (restored.length > 0) setProducts(restored);
        }
        if (res.recoveredSales > 0) {
          const restoredSales = loadStoredSales();
          if (restoredSales.length > 0) setSales(restoredSales);
        }
      }).catch((err) => {
        console.warn('Reconcile storage notice:', err);
      });
    } catch (e) {
      console.warn('Database resilience notice:', e);
    }
  }, []);

  // Real-time synchronization and event listeners
  useEffect(() => {
    let isMounted = true;

    // 1. Initial Bidirectional Sync (pulls real remote data or flushes offline queue)
    async function initSync() {
      setIsSupabaseSyncing(true);
      try {
        const res = await syncAllWithSupabase();
        if (res.success && isMounted) {
          setSupabaseConnected(true);
          // If remote had real data, reflect in local state
          const storedProds = loadStoredProducts();
          if (storedProds.length > 0) setProducts(storedProds);

          const storedSales = loadStoredSales();
          if (storedSales.length > 0) setSales(storedSales);

          const storedOrders = loadStoredWorkOrders();
          if (storedOrders.length > 0) setWorkOrders(storedOrders);

          const storedExp = loadStoredExpenses();
          if (storedExp.length > 0) setExpenses(storedExp);
        }
      } catch (err) {
        console.warn('Initial sync notice:', err);
      } finally {
        if (isMounted) setIsSupabaseSyncing(false);
      }
    }

    initSync();

    // 2. Automatic Sync when Network returns (Online event)
    const handleOnlineEvent = async () => {
      setSupabaseConnected(true);
      toast.info('Ligação à internet restaurada. A sincronizar alterações com outros utilizadores...');
      setIsSupabaseSyncing(true);
      try {
        const res = await syncAllWithSupabase();
        if (res.success) {
          toast.success(res.message);
        }
      } catch (e) {
        console.warn('Auto sync on online notice:', e);
      } finally {
        if (isMounted) setIsSupabaseSyncing(false);
      }
    };

    const handleOfflineEvent = () => {
      setSupabaseConnected(false);
      toast.warning('Modo offline ativado. Todas as operações continuam normais e serão sincronizadas quando reconectar.');
    };

    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);

    // 3. Listen for internal remote-sync-complete custom events
    const handleRemoteSyncCompleted = (e: any) => {
      if (!isMounted) return;
      const { products: p, sales: s, workOrders: wo, expenses: ex, cashSession: cs } = e.detail || {};
      if (Array.isArray(p)) setProducts(p);
      if (Array.isArray(s)) setSales(s);
      if (Array.isArray(wo)) setWorkOrders(wo);
      if (Array.isArray(ex)) setExpenses(ex);
      if (cs !== undefined) setActiveCashSession(cs);
    };

    window.addEventListener(SYNC_COMPLETE_EVENT, handleRemoteSyncCompleted);

    // 4. Subscribe to Realtime Supabase Channels for cross-user live updates
    const productsChannel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const res = await supabaseService.getProducts();
        if (res.fromSupabase && isMounted) {
          setProducts(res.data);
          saveStoredProducts(res.data);
          toast.info('Catálogo de produtos atualizado em tempo real por outro utilizador.');
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && isMounted) setSupabaseConnected(true);
      });

    const ordersChannel = supabase
      .channel('public:service_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, async () => {
        const res = await supabaseService.getServiceOrders();
        if (res.fromSupabase && isMounted) {
          setWorkOrders(res.data);
          saveStoredWorkOrders(res.data);
          toast.info('Ordens de serviço atualizadas em tempo real.');
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && isMounted) setSupabaseConnected(true);
      });

    const salesChannel = supabase
      .channel('public:sales')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, async () => {
        const res = await supabaseService.getSales();
        if (res.fromSupabase && isMounted) {
          setSales(res.data);
          saveStoredSales(res.data);
          toast.info('Nova venda faturada e sincronizada em tempo real.');
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && isMounted) setSupabaseConnected(true);
      });

    const expensesChannel = supabase
      .channel('public:expenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, async () => {
        const res = await supabaseService.getExpenses();
        if (res.fromSupabase && isMounted) {
          setExpenses(res.data);
          saveStoredExpenses(res.data);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && isMounted) setSupabaseConnected(true);
      });

    const cashChannel = supabase
      .channel('public:cash_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_sessions' }, async () => {
        const res = await supabaseService.getActiveCashSession();
        if (res.fromSupabase && isMounted) {
          setActiveCashSession(res.data);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && isMounted) setSupabaseConnected(true);
      });

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnlineEvent);
      window.removeEventListener('offline', handleOfflineEvent);
      window.removeEventListener(SYNC_COMPLETE_EVENT, handleRemoteSyncCompleted);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(cashChannel);
    };
  }, []);

  // Manual On-Demand Synchronization Trigger
  const handleManualSync = async () => {
    setIsSupabaseSyncing(true);
    try {
      const result = await syncAllWithSupabase();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
    } catch (err) {
      toast.error('Erro temporário ao sincronizar dados.');
    } finally {
      setIsSupabaseSyncing(false);
    }
  };

  // Automatic Persistence to localStorage
  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  useEffect(() => {
    saveStoredWorkOrders(workOrders);
  }, [workOrders]);

  useEffect(() => {
    saveStoredCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveStoredSales(sales);
  }, [sales]);

  useEffect(() => {
    saveStoredExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    saveStoredCashSession(activeCashSession);
  }, [activeCashSession]);

  useEffect(() => {
    saveStoredCashMovements(cashMovements);
  }, [cashMovements]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Computed Badge Metrics
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const openWorkOrdersCount = workOrders.filter(wo => wo.status !== 'delivered' && wo.status !== 'canceled').length;
  const todaySalesTotal = sales.reduce((acc, s) => acc + s.total, 0);

  const currentTabMeta = TAB_METADATA[activeTab] || TAB_METADATA.dashboard;
  const IconComponent = currentTabMeta.icon;

  // View switch based on activeTab
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            setActiveTab={(tab) => {
              if (tab === 'pos') setActiveTab('sales');
              else if (tab === 'services') setActiveTab('service_orders');
              else setActiveTab(tab as ActiveTab);
            }}
            products={products}
            workOrders={workOrders}
            customers={customers}
            sales={sales}
            userSession={userSession}
          />
        );
      case 'products':
        return (
          <ProductsView
            products={products}
            setProducts={setProducts}
          />
        );
      case 'service_orders':
        return (
          <ServiceOrdersView
            workOrders={workOrders}
            setWorkOrders={setWorkOrders}
          />
        );
      case 'sales':
        return (
          <PosView
            products={products}
            setProducts={setProducts}
            sales={sales}
            setSales={setSales}
            customers={customers}
            setCustomers={setCustomers}
            settings={settings}
            setActiveTab={setActiveTab}
          />
        );
      case 'cash_session':
        return (
          <CashSessionView
            activeSession={activeCashSession}
            setActiveSession={setActiveCashSession}
            movements={cashMovements}
            setMovements={setCashMovements}
          />
        );
      case 'expenses':
        if (!isAdmin) return null;
        return (
          <ExpensesView
            expenses={expenses}
            setExpenses={setExpenses}
          />
        );
      case 'customers':
        return (
          <CustomersView
            customers={customers}
            setCustomers={setCustomers}
            sales={sales}
          />
        );
      case 'goals':
        return (
          <GoalsView sales={sales} products={products} />
        );
      case 'attendance':
        return (
          <GoalsView initialTab="attendance" sales={sales} products={products} />
        );
      case 'reports':
        if (!isAdmin) return null;
        return (
          <ReportsView
            sales={sales}
            products={products}
            settings={settings}
          />
        );
      case 'audit':
        if (!isAdmin) return null;
        return (
          <ShiftAnalyticsPage />
        );
      case 'settings':
        if (!isAdmin) return null;
        return (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      id="masakula-app-shell" 
      className="min-h-screen bg-[#fcfcfc] text-zinc-950 font-sans flex antialiased selection:bg-zinc-900 selection:text-white"
    >
      {/* 1. App Shell com Sidebar lateral fixa (64px de largura / w-16) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'services') setActiveTab('service_orders');
          else if (tab === 'pos' || tab === 'pdv') setActiveTab('sales');
          else setActiveTab(tab as ActiveTab);
        }}
        lowStockCount={lowStockCount}
        pendingOrdersCount={openWorkOrdersCount}
        userSession={userSession}
        onLogout={onLogout}
      />

      {/* Main Workspace Frame (ml-16 offset for 64px fixed sidebar) */}
      <div className={`flex-1 flex flex-col min-w-0 ml-16 ${activeTab === 'sales' ? 'h-screen overflow-hidden bg-[#F6F6F7]' : 'min-h-screen transition-all duration-200'}`}>
        {/* Sticky Header with Contextual Breadcrumbs (oculto no PDV pois tem barra superior de 56px fundida) */}
        {activeTab !== 'sales' && (
          <Header
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (tab === 'services') setActiveTab('service_orders');
              else if (tab === 'pos' || tab === 'pdv') setActiveTab('sales');
              else setActiveTab(tab as ActiveTab);
            }}
            todaySalesTotal={todaySalesTotal}
            lowStockCount={lowStockCount}
            openOSCount={openWorkOrdersCount}
            onOpenQuickSale={() => setActiveTab('sales')}
            onOpenQuickOS={() => setActiveTab('service_orders')}
            onOpenQuickProduct={() => setActiveTab('products')}
            companyName={settings.companyName}
            tradingName={settings.tradingName}
            userSession={userSession}
            onLogout={onLogout}
            isSupabaseSyncing={isSupabaseSyncing}
            supabaseConnected={supabaseConnected}
            onManualSync={handleManualSync}
          />
        )}

        {/* 5. Área Principal que exibe o título da tela selecionada */}
        <main className={activeTab === 'sales' ? 'flex-1 flex flex-col h-screen overflow-hidden' : 'flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6'}>
          {/* Dynamic Content of the Active Screen */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="h-full flex flex-col"
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Ícone Flutuante da Lixeira (SÓ APARECE PARA ADMINISTRADOR) */}
      {isAdmin && <FloatingTrashCan />}
    </div>
  );
};
