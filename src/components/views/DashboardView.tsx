import React, { useMemo, useState } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  PackagePlus,
  Users,
  Receipt,
  ReceiptText,
  ClipboardCheck,
  ArrowRight,
  ArrowUpRight, 
  Warehouse,
  CheckCircle2,
  MonitorSmartphone,
  Plus,
  ShieldCheck,
  Calculator,
  Filter
} from 'lucide-react';
import { Product, WorkOrder, Customer, SaleTransaction } from '../../types';
import { formatKz, getWorkOrderStatusConfig } from '../../utils/formatters';
import { TopProductsCarousel } from './TopProductsCarousel';

interface DashboardViewProps {
  setActiveTab: (tab: any) => void;
  products: Product[];
  workOrders: WorkOrder[];
  customers: Customer[];
  sales: SaleTransaction[];
  userSession?: import('../../types').UserSession;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  products,
  workOrders,
  customers,
  sales,
  userSession,
}) => {
  const isAdmin = userSession?.role === 'admin' || 
                  userSession?.role === 'Administrador Master' || 
                  userSession?.role === 'Administrador Geral' || 
                  userSession?.role === 'GERENTE' ||
                  userSession?.email?.toLowerCase().includes('admin');

  const [salesFilter, setSalesFilter] = useState<'all' | 'cash' | 'multicaixa' | 'transfer'>('all');

  // Real Financial Calculations (Sem dados fictícios forçados)
  const totalSalesToday = useMemo(() => {
    return sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
  }, [sales]);

  const averageTicket = useMemo(() => {
    if (sales.length === 0) return 0;
    return Math.round(totalSalesToday / sales.length);
  }, [sales.length, totalSalesToday]);

  const maxSaleToday = useMemo(() => {
    if (sales.length === 0) return 0;
    return Math.max(...sales.map(s => s.total || 0));
  }, [sales]);

  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  const openWorkOrders = useMemo(() => {
    return workOrders.filter(wo => wo.status !== 'delivered' && wo.status !== 'canceled');
  }, [workOrders]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock * (p.costPrice || 0)), 0);
  }, [products]);

  const totalPotentialRevenue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock * (p.salePrice || 0)), 0);
  }, [products]);

  const estimatedInventoryMargin = useMemo(() => {
    if (totalInventoryValue === 0) return 0;
    return Math.round(((totalPotentialRevenue - totalInventoryValue) / totalPotentialRevenue) * 100);
  }, [totalInventoryValue, totalPotentialRevenue]);

  // Formata o número retirando o "Kz" do final para poder usar a tipografia customizada com <span>Kz</span>
  const revenueFormattedString = useMemo(() => {
    const formatted = formatKz(totalSalesToday);
    return formatted.replace(/\s*Kz$/, '');
  }, [totalSalesToday]);

  // Onboarding Steps Calculation
  const hasProducts = products.length > 0;
  const hasCustomers = customers.length > 0;
  const hasSales = sales.length > 0;

  const completedSteps = (hasProducts ? 1 : 0) + (hasCustomers ? 1 : 0) + (hasSales ? 1 : 0);
  const progressPercent = Math.round((completedSteps / 3) * 100);

  // Filtered sales
  const filteredSales = useMemo(() => {
    if (salesFilter === 'all') return sales;
    if (salesFilter === 'cash') return sales.filter(s => s.paymentMethod === 'cash');
    if (salesFilter === 'multicaixa') return sales.filter(s => s.paymentMethod === 'multicaixa');
    return sales.filter(s => s.paymentMethod === 'transfer' || s.paymentMethod === 'express');
  }, [sales, salesFilter]);

  // Formatted date string in Portuguese
  const formattedToday = useMemo(() => {
    return new Intl.DateTimeFormat('pt-AO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  }, []);

  return (
    <div id="view-dashboard" className="space-y-6 text-[#111111] animate-in fade-in duration-200">
      {/* Top Action Bar do Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Masakula ERP & PDV</span>
            <span className="text-neutral-300">•</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ShieldCheck size={12} className="text-emerald-600" />
              100% Offline &amp; BD Local
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight capitalize">
            Painel Geral
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5 capitalize first-letter:uppercase">
            {formattedToday}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus size={14} className="text-neutral-500" />
            <span>Novo Artigo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('service_orders')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Wrench size={14} className="text-neutral-500" />
            <span>Nova O.S.</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <MonitorSmartphone size={16} className="text-[#c8ff3d]" />
            <span>Abrir PDV (Frente de Caixa)</span>
          </button>
        </div>
      </div>

      {/* Top Products Carousel se houver produtos */}
      {hasProducts && (
        <div className="animate-in fade-in duration-200">
          <TopProductsCarousel onAddToCart={() => setActiveTab('sales')} />
        </div>
      )}

      {/* =========================================================================
          BENTO GRID PRINCIPAL (12 COLUNAS)
         ========================================================================= */}
      <div className="dash-grid">
        {/* ==================== 1. HERO: FATURAÇÃO (SPAN 5) ==================== */}
        <section className="dash-card dash-hero">
          <div>
            <div className="label">
              <span>Faturação hoje</span>
              <span className="dash-pill">
                {sales.length > 0 ? `${sales.length} transações` : 'Dia corrente'}
              </span>
            </div>
            <div className="value">
              {revenueFormattedString} <span>Kz</span>
            </div>
            <div className="sub">
              {sales.length === 1 ? '1 venda concluída no turno de hoje' : `${sales.length} vendas concluídas no turno de hoje`}
            </div>

            {/* Micro-indicadores de apoio dentro do Hero */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-neutral-100/80 text-[11px]">
              <div>
                <span className="text-neutral-400 block font-medium">Ticket Médio</span>
                <strong className="text-neutral-800 font-bold" data-numeric="true">
                  {formatKz(averageTicket)}
                </strong>
              </div>
              <div>
                <span className="text-neutral-400 block font-medium">Maior Venda</span>
                <strong className="text-neutral-800 font-bold" data-numeric="true">
                  {formatKz(maxSaleToday)}
                </strong>
              </div>
            </div>
          </div>

          {/* Mini-gráfico Sparkline em SVG com gradiente verde */}
          <svg className="dash-spark" viewBox="0 0 300 70" preserveAspectRatio="none">
            <defs>
              <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="1" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            {sales.length > 0 ? (
              <>
                <path d="M0 60 Q 60 40, 120 48 T 200 25 T 300 15 V 70 H 0 Z" fill="url(#spark-grad)" />
                <path d="M0 60 Q 60 40, 120 48 T 200 25 T 300 15" stroke="#10b981" strokeWidth="2.5" fill="none" />
              </>
            ) : (
              <>
                <path d="M0 60 H 300 V 70 H 0 Z" fill="url(#spark-grad)" />
                <path d="M0 60 H 300" stroke="#10b981" strokeWidth="2" strokeDasharray="4 5" fill="none" />
              </>
            )}
          </svg>
        </section>

        {/* ==================== 2. GUIA DE ARRANQUE COM PASSOS (SPAN 7) ==================== */}
        <section className="dash-card dash-onboard">
          <div className="card-head">
            <div>
              <h2>Comece em 3 passos</h2>
              <p>
                {completedSteps === 3 
                  ? 'Sistema 100% configurado e pronto a operar' 
                  : completedSteps > 0 
                  ? `${completedSteps} de 3 passos concluídos • continue a configurar` 
                  : 'Sistema pronto • base de dados em folha em branco'}
              </p>
              <div className="dash-progress">
                <div style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            <span className="dash-pill" style={{ background: 'var(--dash-brand-soft)', color: 'var(--dash-brand)' }}>
              {completedSteps} / 3
            </span>
          </div>

          <div className="dash-steps">
            {/* Passo 1: Produtos */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('products')}
              className="dash-step"
            >
              <div className="ico c-green">
                <PackagePlus size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <b>Cadastrar primeiro artigo</b>
                  {hasProducts && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                </div>
                <span>
                  {hasProducts ? `${products.length} artigos no catálogo` : 'Adicione produtos ou serviços ao catálogo'}
                </span>
              </div>
              <div className="go">
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Passo 2: Clientes */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('customers')}
              className="dash-step"
            >
              <div className="ico c-amber">
                <Users size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <b>Adicionar clientes</b>
                  {hasCustomers && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                </div>
                <span>
                  {hasCustomers ? `${customers.length} clientes cadastrados` : 'Registe NIF e contactos para faturar mais rápido'}
                </span>
              </div>
              <div className="go">
                <ArrowRight size={16} />
              </div>
            </div>

            {/* Passo 3: PDV */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('sales')}
              className="dash-step"
            >
              <div className="ico c-indigo">
                <Receipt size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <b>Abrir Frente de Caixa PDV</b>
                  {hasSales && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                </div>
                <span>
                  {hasSales ? `${sales.length} vendas faturadas hoje` : 'Emita a sua primeira fatura no PDV'}
                </span>
              </div>
              <div className="go">
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 3. KPIS EMPILHADOS (3x SPAN 4) ==================== */}
        {/* KPI 1: O.S. em andamento */}
        <article 
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('service_orders')}
          className="dash-card dash-kpi"
        >
          <div className="ico c-indigo">
            <Wrench size={22} />
          </div>
          <div>
            <small>O.S. em andamento</small>
            <strong>{openWorkOrders.length}</strong>
            <em>{openWorkOrders.length > 0 ? `${openWorkOrders.length} aguardando finalização` : 'Sem ordens pendentes'}</em>
          </div>
        </article>

        {/* KPI 2: Alertas de Stock */}
        <article 
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('products')}
          className="dash-card dash-kpi"
        >
          <div className="ico c-amber">
            <AlertTriangle size={22} />
          </div>
          <div>
            <small>Alertas de stock</small>
            <strong className={lowStockItems.length > 0 ? 'text-amber-600' : ''}>{lowStockItems.length}</strong>
            <em>{lowStockItems.length > 0 ? `${lowStockItems.length} artigos em stock crítico` : 'Stock regularizado'}</em>
          </div>
        </article>

        {/* KPI 3: Valor em Armazém */}
        <article 
          role="button"
          tabIndex={0}
          onClick={() => isAdmin ? setActiveTab('reports') : setActiveTab('products')}
          className="dash-card dash-kpi"
        >
          <div className="ico c-green">
            <Warehouse size={22} />
          </div>
          <div>
            <small>Valor em armazém</small>
            <strong data-numeric="true">{formatKz(totalInventoryValue)}</strong>
            <em>{isAdmin ? `Previsão: ${formatKz(totalPotentialRevenue)} (${estimatedInventoryMargin}% margem)` : `${products.length} artigos no catálogo`}</em>
          </div>
        </article>

        {/* ==================== 4. TABELA DE VENDAS (SPAN 8) ==================== */}
        <section className="dash-card dash-sales">
          <div className="card-head">
            <div>
              <h2>Últimas Vendas &amp; Faturação</h2>
              <p>Transações do dia no Ponto de Venda</p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Filtro rápido por método de pagamento */}
              <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setSalesFilter('all')}
                  className={`px-2 py-1 rounded-md transition-all ${salesFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setSalesFilter('cash')}
                  className={`px-2 py-1 rounded-md transition-all ${salesFilter === 'cash' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  Dinheiro
                </button>
                <button
                  type="button"
                  onClick={() => setSalesFilter('multicaixa')}
                  className={`px-2 py-1 rounded-md transition-all ${salesFilter === 'multicaixa' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  TPA
                </button>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className="dash-link"
                >
                  <span>Ver relatórios</span>
                  <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="dash-empty">
              <div className="ico">
                <ReceiptText size={22} />
              </div>
              <p>
                {sales.length === 0 
                  ? 'Nenhuma venda registada hoje no sistema.' 
                  : 'Nenhuma venda encontrada para o filtro selecionado.'}
              </p>
              <button 
                type="button"
                onClick={() => setActiveTab('sales')}
                className="btn-ghost"
              >
                Abrir Frente de Caixa
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Doc / Fatura</th>
                    <th>Cliente</th>
                    <th>Itens</th>
                    <th>Pagamento</th>
                    <th>Total (Kz)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {filteredSales.slice(0, 6).map((sale) => (
                    <tr key={sale.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 font-semibold text-neutral-900">{sale.invoiceNumber}</td>
                      <td className="py-3">
                        <div className="font-medium text-neutral-900">{sale.customerName || 'Consumidor final'}</div>
                        {sale.customerNif && (
                          <div className="text-[10px] text-neutral-400">NIF: {sale.customerNif}</div>
                        )}
                      </td>
                      <td className="py-3 text-neutral-600 font-mono">
                        {sale.items.reduce((sum, item) => sum + item.quantity, 0)} un.
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 ${
                          sale.paymentMethod === 'transfer'
                            ? 'bg-purple-50 text-purple-700'
                            : sale.paymentMethod === 'multicaixa'
                            ? 'bg-blue-50 text-blue-700'
                            : sale.paymentMethod === 'express'
                            ? 'bg-lime-50 text-lime-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {sale.paymentMethod === 'transfer' 
                            ? 'Transf. Bancária' 
                            : sale.paymentMethod === 'express'
                            ? 'MCX Express'
                            : sale.paymentMethod === 'multicaixa' 
                            ? 'TPA / Multicaixa' 
                            : 'Dinheiro'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-extrabold text-neutral-950" data-numeric="true">
                        {formatKz(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ==================== 5. ASSISTÊNCIA TÉCNICA (SPAN 4) ==================== */}
        <section className="dash-card dash-tech">
          <div className="card-head">
            <div>
              <h2>Assistência Técnica</h2>
              <p>Ordens prioritárias de serviço</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('service_orders')}
              className="dash-link"
            >
              <span>Gerir</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {workOrders.length === 0 ? (
            <div className="dash-empty">
              <div className="ico">
                <ClipboardCheck size={22} />
              </div>
              <p>Nenhuma ordem de serviço registada.</p>
              <button 
                type="button"
                onClick={() => setActiveTab('service_orders')}
                className="btn-ghost"
              >
                Criar O.S.
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {workOrders.slice(0, 4).map((wo) => {
                const statusConfig = getWorkOrderStatusConfig(wo.status);
                return (
                  <div
                    key={wo.id}
                    onClick={() => setActiveTab('service_orders')}
                    className="p-3 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 transition-all cursor-pointer flex justify-between items-center text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">{wo.code}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          statusConfig.variant === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="font-medium text-neutral-800 mt-1 truncate">{wo.equipment}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{wo.customerName}</p>
                    </div>
                    <span className="font-bold text-neutral-950 shrink-0" data-numeric="true">
                      {formatKz(wo.totalCost)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ==================== 6. STRIP DE BALANÇO RÁPIDO (SPAN 12) ==================== */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-neutral-900 text-white shadow-xs">
          <div className="p-2">
            <span className="text-[11px] text-neutral-400 block font-medium">Artigos no Catálogo</span>
            <div className="text-xl font-bold tracking-tight text-white mt-1">
              {products.length} <span className="text-xs font-normal text-neutral-400">itens</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {lowStockItems.length > 0 ? `${lowStockItems.length} com alerta de stock` : 'Todos em stock normal'}
            </div>
          </div>

          <div className="p-2">
            <span className="text-[11px] text-neutral-400 block font-medium">Clientes Cadastrados</span>
            <div className="text-xl font-bold tracking-tight text-white mt-1">
              {customers.length} <span className="text-xs font-normal text-neutral-400">contas</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              Base de clientes local
            </div>
          </div>

          <div className="p-2">
            <span className="text-[11px] text-neutral-400 block font-medium">Faturação Acumulada</span>
            <div className="text-xl font-bold tracking-tight text-[#c8ff3d] mt-1" data-numeric="true">
              {formatKz(totalSalesToday)}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {sales.length} vendas registadas
            </div>
          </div>

          <div className="p-2">
            <span className="text-[11px] text-neutral-400 block font-medium">Ordens de Reparação</span>
            <div className="text-xl font-bold tracking-tight text-white mt-1">
              {workOrders.length} <span className="text-xs font-normal text-neutral-400">O.S.</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {openWorkOrders.length} ativas em bancada
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
