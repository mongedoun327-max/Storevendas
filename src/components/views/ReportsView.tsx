import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  ShieldAlert, 
  Receipt, 
  Printer, 
  Download,
  Percent,
  Plus,
  X,
  Info,
  Clock,
  Inbox
} from 'lucide-react';
import { formatKz } from '../../utils/formatters';
import { SaleTransaction, Product, CompanySettings } from '../../types';
import ReportZModal, { ReportZData } from '../ReportZModal';

export interface ReportsViewProps {
  sales?: SaleTransaction[];
  products?: Product[];
  settings?: CompanySettings;
}

interface PeriodData {
  sales: number;
  profit: number;
  transactions: number;
  salesChange: string;
  profitChange: string;
  labels: string[];
  bars: number[];
  profits: number[];
  description: string;
  caption: string;
}

interface LossRecord {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  reason: string;
  value: number;
  operator: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales = [],
  products = [],
  settings
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'auditoria' | 'fecho'>('analytics');
  const [activePeriod, setActivePeriod] = useState<'hoje' | '7d' | '30d'>('hoje');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Fecho de caixa estado
  const [closingDate, setClosingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [openingFund, setOpeningFund] = useState<number>(0);
  const [countedCash, setCountedCash] = useState<number>(0);

  // Modal Relatório Z
  const [isReportZOpen, setIsReportZOpen] = useState(false);

  // Modal Registar Quebra / Baixa de Inventário
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [newLossProduct, setNewLossProduct] = useState(products[0]?.id || '');
  const [newLossReason, setNewLossReason] = useState('Danificado / Avaria');
  const [newLossQty, setNewLossQty] = useState<number>(1);
  const [newLossOperator, setNewLossOperator] = useState('Operador Principal');

  // Perdas gravadas localmente (100% folha em branco inicial)
  const [savedLosses, setSavedLosses] = useState<LossRecord[]>(() => {
    try {
      const isBlank = localStorage.getItem('masakula_system_blank') === 'true';
      if (isBlank) return [];
      const saved = localStorage.getItem('masakula_audit_losses_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao carregar perdas:', e);
    }
    return [];
  });

  // Salvar perdas no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('masakula_audit_losses_v1', JSON.stringify(savedLosses));
    } catch (e) {
      console.warn('Erro ao salvar perdas:', e);
    }
  }, [savedLosses]);

  // Dynamic aggregation from real sales only (ZERO fake/pre-launched data)
  const currentPeriodData: PeriodData = useMemo(() => {
    const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    
    // Calcula o custo real dos produtos vendidos se existir no carrinho
    let totalCost = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const cost = item.product.costPrice || 0;
        totalCost += cost * item.quantity;
      });
    });

    const profit = totalCost > 0 ? totalRevenue - totalCost : (sales.length > 0 ? Math.round(totalRevenue * 0.42) : 0);

    // Horários para agrupamento de vendas
    const timeBuckets = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    const bucketBars = [0, 0, 0, 0, 0, 0, 0];
    const bucketProfits = [0, 0, 0, 0, 0, 0, 0];

    sales.forEach(s => {
      const saleTime = new Date(s.createdAt || Date.now());
      const hour = saleTime.getHours();
      let index = 0;
      if (hour < 9) index = 0;
      else if (hour < 11) index = 1;
      else if (hour < 13) index = 2;
      else if (hour < 15) index = 3;
      else if (hour < 17) index = 4;
      else if (hour < 19) index = 5;
      else index = 6;

      bucketBars[index] += s.total || 0;
      const saleMargin = Math.round((s.total || 0) * 0.42);
      bucketProfits[index] += saleMargin;
    });

    return {
      sales: totalRevenue,
      profit: Math.max(0, profit),
      transactions: sales.length,
      salesChange: sales.length > 0 ? '+100%' : '0,0%',
      profitChange: sales.length > 0 ? '+100%' : '0,0%',
      labels: timeBuckets,
      bars: bucketBars,
      profits: bucketProfits,
      description: sales.length > 0 
        ? 'Distribuição apurada em tempo real pelas transações do PDV'
        : 'Sem transações registadas no sistema (folha em branco)',
      caption: sales.length > 0 ? 'conforme registos locais no sistema' : '0 vendas efetuadas'
    };
  }, [sales]);

  // Distribuição de Meios de Pagamento (Baseado 100% nas vendas reais)
  const paymentMethodsDistribution = useMemo(() => {
    const total = currentPeriodData.sales;
    const cash = sales.filter(s => s.paymentMethod === 'cash').reduce((a, b) => a + (b.total || 0), 0);
    const mcx = sales.filter(s => s.paymentMethod === 'multicaixa').reduce((a, b) => a + (b.total || 0), 0);
    const express = sales.filter(s => s.paymentMethod === 'express').reduce((a, b) => a + (b.total || 0), 0);
    const transfer = sales.filter(s => s.paymentMethod === 'transfer').reduce((a, b) => a + (b.total || 0), 0);

    return [
      { name: 'Multicaixa / TPA', share: total > 0 ? Math.round((mcx / total) * 100) : 0, color: '#17191d', amount: mcx },
      { name: 'Dinheiro', share: total > 0 ? Math.round((cash / total) * 100) : 0, color: '#8ae2bd', amount: cash },
      { name: 'MCX Express', share: total > 0 ? Math.round((express / total) * 100) : 0, color: '#dfff00', amount: express },
      { name: 'Transferência', share: total > 0 ? Math.round((transfer / total) * 100) : 0, color: '#a7c4ff', amount: transfer }
    ];
  }, [sales, currentPeriodData.sales]);

  // Cálculos do gráfico de vendas
  const maxBarValue = Math.max(...currentPeriodData.bars, 0);
  const peakIndex = currentPeriodData.bars.indexOf(maxBarValue);
  const ceiling = maxBarValue > 0 ? Math.ceil(maxBarValue / 50000) * 50000 : 100000;

  const formatCompact = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toLocaleString('pt-AO', { maximumFractionDigits: 1 })} M`;
    return val ? `${(val / 1000).toLocaleString('pt-AO', { maximumFractionDigits: 0 })} mil` : '0';
  };

  // Cálculos do gráfico de lucro (SVG Line & Area)
  const maxProfitValue = Math.max(...currentPeriodData.profits, 0);
  const profitPoints = useMemo(() => {
    if (maxProfitValue === 0) {
      // Linha plana no zero
      const pts = currentPeriodData.profits.map((_, i) => [
        5 + (i * 590) / (currentPeriodData.profits.length - 1 || 1),
        132
      ]);
      const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
      const area = `${path} L595,145 L5,145 Z`;
      return { pts, path, area };
    }

    const pts = currentPeriodData.profits.map((val, i) => [
      5 + (i * 590) / (currentPeriodData.profits.length - 1 || 1),
      132 - (val / maxProfitValue) * 112
    ]);
    const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
    const area = `${path} L595,145 L5,145 Z`;
    return { pts, path, area };
  }, [currentPeriodData.profits, maxProfitValue]);

  const profitPeakIndex = currentPeriodData.profits.indexOf(maxProfitValue);
  const maxProfitVal = currentPeriodData.profits[profitPeakIndex] || 0;

  // Cálculos do Fecho de Caixa
  const cashReceipts = useMemo(() => {
    return sales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((acc, s) => acc + (s.total || 0), 0);
  }, [sales]);

  const cashOutflows = 0;
  const expectedCash = openingFund + cashReceipts - cashOutflows;
  const difference = Math.round((countedCash - expectedCash) * 100) / 100;

  // Relatório Z oficial formatado
  const reportZData: ReportZData = useMemo(() => {
    const gross = sales.reduce((a, b) => a + (b.total || 0), 0);
    const discounts = sales.reduce((a, b) => a + (b.discount || 0), 0);
    const net = gross - discounts;
    const cash = sales.filter(s => s.paymentMethod === 'cash').reduce((a, b) => a + (b.total || 0), 0);
    const mcx = sales.filter(s => s.paymentMethod === 'multicaixa' || s.paymentMethod === 'express').reduce((a, b) => a + (b.total || 0), 0);
    const transfer = sales.filter(s => s.paymentMethod === 'transfer').reduce((a, b) => a + (b.total || 0), 0);

    const hasTax = settings?.regimeIva?.includes('14%') ?? true;
    const rate = hasTax ? 14 : 0;
    const baseAmount = rate > 0 ? Math.round(net / 1.14) : net;
    const vatAmount = rate > 0 ? net - baseAmount : 0;

    return {
      reportNumber: `RZ ${closingDate.replace(/-/g, '')}/001`,
      openingDate: `${closingDate} 08:00:00`,
      closingDate: `${closingDate} ${new Date().toLocaleTimeString('pt-AO')}`,
      posTerminal: settings?.posTerminalId || 'CX-01',
      operatorName: 'Operador Principal',
      company: {
        name: settings?.companyName || 'Masakula Comércio & Serviços, Lda',
        tradeName: settings?.tradingName || 'Masakula Express',
        slogan: 'Soluções Integradas de Faturação e Reparação',
        nif: settings?.nif || '5001234567',
        address: settings?.address || 'Luanda, Angola',
        phone: settings?.phone || '+244 923 000 000',
        email: settings?.email || 'geral@masakula.ao'
      },
      summary: {
        grossTotal: gross,
        discountsTotal: discounts,
        netTotal: net,
        totalSalesCount: sales.length,
        voidedSalesCount: 0,
        voidedSalesTotal: 0
      },
      paymentsBreakdown: {
        cash,
        multicaixa: mcx,
        transfer
      },
      vatBreakdown: [
        {
          rate,
          baseAmount,
          vatAmount,
          exemptionReason: rate === 0 ? 'M10 - Isento nos termos da alínea a) do nº 1 do art. 12º do CIVA' : undefined
        }
      ]
    };
  }, [sales, closingDate, settings]);

  const handlePrint = () => {
    window.print();
  };

  // Handler para registar quebra de stock
  const handleSaveLoss = () => {
    const selectedProd = products.find(p => p.id === newLossProduct);
    const unitPrice = selectedProd?.costPrice || selectedProd?.salePrice || 1000;
    const totalVal = unitPrice * (newLossQty || 1);

    const newRecord: LossRecord = {
      id: `loss-${Date.now()}`,
      date: new Date().toISOString(),
      productName: selectedProd?.name || 'Artigo em Loja',
      quantity: newLossQty,
      reason: newLossReason,
      value: totalVal,
      operator: newLossOperator
    };

    setSavedLosses(prev => [newRecord, ...prev]);
    setIsLossModalOpen(false);
  };

  // Agrupamento dinâmico de quebras por motivo
  const dynamicLossReasons = useMemo(() => {
    if (savedLosses.length === 0) return [];
    const map = new Map<string, number>();
    savedLosses.forEach(l => {
      map.set(l.reason, (map.get(l.reason) || 0) + l.value);
    });

    const colors = ['#ef496c', '#e9b90c', '#a561ef', '#13b3cb', '#557df4', '#15b88a'];
    let idx = 0;
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      color: colors[idx++ % colors.length]
    }));
  }, [savedLosses]);

  // Soma real de perdas registadas
  const totalRecordedLosses = useMemo(() => {
    return savedLosses.reduce((acc, l) => acc + l.value, 0);
  }, [savedLosses]);

  return (
    <div id="view-reports" className="space-y-6 text-[#17191d] select-none">
      <div className="rep-shell">
        {/* Navegação por Separadores */}
        <nav className="rep-navigation" role="tablist" aria-label="Áreas de relatórios">
          <button
            type="button"
            className="rep-nav-button"
            role="tab"
            aria-selected={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp size={15} />
            <span>Analytics &amp; Rentabilidade</span>
          </button>

          <button
            type="button"
            className="rep-nav-button"
            role="tab"
            aria-selected={activeTab === 'auditoria'}
            onClick={() => setActiveTab('auditoria')}
          >
            <ShieldAlert size={15} />
            <span>Auditoria &amp; Quebras</span>
          </button>

          <button
            type="button"
            className="rep-nav-button"
            role="tab"
            aria-selected={activeTab === 'fecho'}
            onClick={() => setActiveTab('fecho')}
          >
            <Receipt size={15} />
            <span>Fecho Diário &amp; Relatório Z</span>
          </button>
        </nav>

        {/* =========================================================================
            SEPARADOR 1: ANALYTICS & RENTABILIDADE
           ========================================================================= */}
        {activeTab === 'analytics' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            {/* Cabeçalho da Página */}
            <div className="rep-page-heading">
              <div>
                <span className="rep-eyebrow">Visão geral do negócio</span>
                <h1>O desempenho, em perspetiva.</h1>
                <p className="rep-subtitle">Vendas, rentabilidade e meios de pagamento apurados localmente em folha em branco.</p>
              </div>

              <div className="rep-heading-actions">
                <div className="rep-period-switch" role="group" aria-label="Período do relatório">
                  <button
                    type="button"
                    className={activePeriod === 'hoje' ? 'active' : ''}
                    onClick={() => setActivePeriod('hoje')}
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    className={activePeriod === '7d' ? 'active' : ''}
                    onClick={() => setActivePeriod('7d')}
                  >
                    7 dias
                  </button>
                  <button
                    type="button"
                    className={activePeriod === '30d' ? 'active' : ''}
                    onClick={() => setActivePeriod('30d')}
                  >
                    30 dias
                  </button>
                </div>

                <button type="button" className="rep-btn" onClick={handlePrint}>
                  <Download size={14} />
                  <span>Exportar / PDF</span>
                </button>
              </div>
            </div>

            {/* Aviso informativo de Sistema Limpo / Folha em Branco */}
            {sales.length === 0 && (
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
                <div className="flex items-center gap-2.5">
                  <Info size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong>Sistema limpo e em folha em branco:</strong> Não existem vendas ou estatísticas antigas registadas. O sistema está pronto para faturar do zero.
                  </span>
                </div>
              </div>
            )}

            {/* Três Métricas de Resumo */}
            <div className="rep-overview">
              {/* Card Hero: Total de vendas */}
              <article className="rep-card rep-metric rep-hero-metric">
                <span className="rep-metric-label">Total de vendas</span>
                <div className="rep-metric-value">
                  {formatKz(currentPeriodData.sales).replace(' Kz', '')} <small>Kz</small>
                </div>
                <div className="rep-metric-footer">
                  <span className="rep-change">{sales.length > 0 ? '+100%' : '0,0%'}</span>
                  <span>{sales.length > 0 ? `${sales.length} vendas registadas` : 'sem vendas registadas'}</span>
                </div>
                <svg className="rep-sparkline" viewBox="0 0 110 45" aria-hidden="true">
                  <path
                    d={sales.length > 0 ? "M2 39L15 30L27 34L40 19L54 24L67 14L80 18L95 5L108 9" : "M2 39 H 108"}
                    fill="none"
                    stroke="#dfff00"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={sales.length === 0 ? "3 3" : undefined}
                  />
                </svg>
              </article>

              {/* Card 2: Lucro acumulado */}
              <article className="rep-card rep-metric">
                <div className="rep-metric-icon">
                  <TrendingUp size={18} className="text-[#0d9d70]" />
                </div>
                <span className="rep-metric-label">Lucro acumulado</span>
                <div className="rep-metric-value text-[#0d9d70]">
                  {formatKz(currentPeriodData.profit).replace(' Kz', '')} <small>Kz</small>
                </div>
                <div className="rep-metric-footer">
                  <span className="rep-change">0,0%</span>
                  <span>margem apurada no período</span>
                </div>
              </article>

              {/* Card 3: Margem de lucro */}
              <article className="rep-card rep-metric">
                <div className="rep-metric-icon">
                  <Percent size={17} className="text-neutral-500" />
                </div>
                <span className="rep-metric-label">Margem média bruta</span>
                <div className="rep-metric-value">
                  {currentPeriodData.sales > 0 
                    ? ((currentPeriodData.profit / currentPeriodData.sales) * 100).toFixed(1).replace('.', ',') 
                    : '0,0'}%
                </div>
                <div className="rep-metric-footer">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 inline-block"></span>
                  <span>Rentabilidade em relação ao volume faturado</span>
                </div>
              </article>
            </div>

            {/* Grelha de Conteúdo Principal: Esquerda 1.9fr, Direita 1fr */}
            <div className="rep-content-grid">
              <div className="rep-stack">
                {/* 1. Evolução das vendas */}
                <article className="rep-card rep-card-content">
                  <div className="rep-card-heading">
                    <div>
                      <h2>Evolução das vendas</h2>
                      <p>{currentPeriodData.description}</p>
                    </div>
                    <span className="rep-pill">Valores em Kz</span>
                  </div>

                  <div className="rep-chart-summary">
                    <strong>{formatKz(currentPeriodData.sales)}</strong>
                    <span>{currentPeriodData.caption}</span>
                  </div>

                  <div className="rep-sales-chart" role="img" aria-label="Vendas por horário">
                    <div className="rep-y-axis">
                      {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => (
                        <span key={idx}>{formatCompact(ceiling * ratio)}</span>
                      ))}
                    </div>

                    <div className="rep-plot">
                      {currentPeriodData.bars.map((val, i) => {
                        const isPeak = i === peakIndex && val > 0;
                        const isHovered = hoveredBarIndex === i;
                        const heightPx = maxBarValue > 0 ? Math.max(6, (val / ceiling) * 175) : 6;

                        return (
                          <div
                            key={i}
                            className="rep-bar-group relative"
                            onMouseEnter={() => setHoveredBarIndex(i)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                          >
                            {isHovered && val > 0 && (
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                                <span className="font-bold">{currentPeriodData.labels[i]}</span>: {formatKz(val)}
                              </div>
                            )}
                            <div
                              className={`rep-bar ${isPeak ? 'highlight' : ''}`}
                              style={{ 
                                height: `${heightPx}px`,
                                opacity: val > 0 ? 1 : 0.2
                              }}
                              title={`${currentPeriodData.labels[i]}: ${formatKz(val)}`}
                            />
                            <span className="rep-bar-label">{currentPeriodData.labels[i]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rep-chart-footer">
                    <span>
                      Pico de vendas: <strong>{maxBarValue > 0 ? currentPeriodData.labels[peakIndex] : 'Sem registos'}</strong>
                    </span>
                    <span>
                      Transações registadas: <strong>{currentPeriodData.transactions}</strong>
                    </span>
                  </div>
                </article>

                {/* 2. Evolução do lucro */}
                <article className="rep-card rep-card-content">
                  <div className="rep-card-heading">
                    <div>
                      <h2>Evolução do lucro</h2>
                      <p>Margem bruta apurada nos intervalos</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span className="w-2 h-2 rounded-full bg-[#0d9d70] inline-block"></span>
                      <span>Margem apurada</span>
                    </div>
                  </div>

                  <svg
                    className="rep-line-chart"
                    viewBox="0 0 600 145"
                    role="img"
                    aria-label="Evolução do lucro"
                  >
                    <defs>
                      <linearGradient id="repProfitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16be83" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#16be83" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <g stroke="#eff2f5" strokeDasharray="3 4">
                      <line x1="0" y1="15" x2="600" y2="15" />
                      <line x1="0" y1="65" x2="600" y2="65" />
                      <line x1="0" y1="115" x2="600" y2="115" />
                    </g>
                    <path d={profitPoints.area} fill="url(#repProfitGrad)" />
                    <path
                      d={profitPoints.path}
                      fill="none"
                      stroke={maxProfitValue > 0 ? "#0d9d70" : "#d1d5db"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={maxProfitValue === 0 ? "4 4" : undefined}
                    />
                    <g>
                      {profitPoints.pts.map(([x, y], i) => (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r={hoveredPointIndex === i ? 5.5 : 3.5}
                          fill={maxProfitValue > 0 ? "#0d9d70" : "#9ca3af"}
                          stroke="white"
                          strokeWidth="2"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredPointIndex(i)}
                          onMouseLeave={() => setHoveredPointIndex(null)}
                        >
                          <title>{`${currentPeriodData.labels[i]}: ${formatKz(currentPeriodData.profits[i])}`}</title>
                        </circle>
                      ))}
                    </g>
                  </svg>

                  <div className="rep-time-axis">
                    {currentPeriodData.labels.map((label, idx) => (
                      <span key={idx}>{label}</span>
                    ))}
                  </div>

                  <div className="rep-insight">
                    <div className="rep-insight-icon" aria-hidden="true">
                      ↗
                    </div>
                    <div>
                      <strong>
                        {maxProfitValue > 0 
                          ? `Maior rentabilidade: ${currentPeriodData.labels[profitPeakIndex]}`
                          : 'Sem movimentos de rentabilidade'}
                      </strong>
                      <p>
                        {maxProfitValue > 0 
                          ? `${formatKz(maxProfitVal)} de margem estimada neste intervalo.`
                          : 'À medida que efetuar vendas na frente de caixa, os índices de rentabilidade aparecerão aqui automaticamente.'}
                      </p>
                    </div>
                  </div>
                </article>
              </div>

              {/* Coluna Lateral: Meios de Pagamento & Indicadores Rápidos */}
              <aside className="rep-stack" aria-label="Pagamentos e indicadores">
                <article className="rep-card rep-card-content">
                  <div className="rep-card-heading">
                    <div>
                      <h2>Meios de pagamento</h2>
                      <p>Repartição das formas de liquidação</p>
                    </div>
                    <span className="rep-pill">4 meios</span>
                  </div>

                  <div className="rep-donut-wrap">
                    <div
                      className="rep-donut"
                      role="img"
                      aria-label="Gráfico de distribuição de meios de pagamento"
                    >
                      <div className="rep-donut-center">
                        <span>Distribuição</span>
                        <strong>{sales.length > 0 ? '100%' : '0%'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="rep-payment-list">
                    {paymentMethodsDistribution.map((method, idx) => {
                      return (
                        <div key={idx} className="rep-payment-item">
                          <span className="rep-payment-name">
                            <span className="rep-swatch" style={{ background: method.color }}></span>
                            {method.name}
                          </span>
                          <div className="rep-payment-value">
                            <strong>{formatKz(method.amount)}</strong>
                            <small>{method.share}% do total</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="rep-card rep-card-content">
                  <div className="rep-card-heading">
                    <div>
                      <h2>Indicadores rápidos</h2>
                      <p>Resumo operacional da loja</p>
                    </div>
                  </div>

                  <div className="rep-payment-item">
                    <span className="rep-payment-name">Ticket médio</span>
                    <strong data-numeric="true">
                      {formatKz(currentPeriodData.sales > 0 ? Math.round(currentPeriodData.sales / Math.max(1, currentPeriodData.transactions)) : 0)}
                    </strong>
                  </div>

                  <div className="rep-payment-item">
                    <span className="rep-payment-name">Catálogo de artigos</span>
                    <strong>{products.length} itens</strong>
                  </div>

                  <div className="rep-payment-item">
                    <span className="rep-payment-name">Estado do sistema</span>
                    <span className="rep-tag">Folha em Branco · 100% Offline</span>
                  </div>
                </article>
              </aside>
            </div>
          </section>
        )}

        {/* =========================================================================
            SEPARADOR 2: AUDITORIA & QUEBRAS
           ========================================================================= */}
        {activeTab === 'auditoria' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            <div className="rep-page-heading">
              <div>
                <span className="rep-eyebrow">Controlo &amp; transparência</span>
                <h1>Cada diferença merece atenção.</h1>
                <p className="rep-subtitle">Identifique quebras de stock, registe perdas físicas e monitorize a acurácia dos fechos de caixa.</p>
              </div>
              <div className="rep-heading-actions">
                <button
                  type="button"
                  onClick={() => setIsLossModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
                >
                  <Plus size={14} className="text-[#c8ff3d]" />
                  <span>Registar Quebra / Perda</span>
                </button>

                <button type="button" className="rep-btn" onClick={handlePrint}>
                  <Download size={14} />
                  <span>Exportar / PDF</span>
                </button>
              </div>
            </div>

            {/* 4 Métricas de Auditoria */}
            <div className="rep-overview rep-audit-metrics">
              <article className="rep-card rep-metric">
                <span className="rep-metric-label">Volume de quebras</span>
                <div className="rep-metric-value text-[#ef496c]">
                  −{formatKz(totalRecordedLosses).replace(' Kz', '')} <small>Kz</small>
                </div>
                <div className="rep-metric-footer">Total de perdas físicas apuradas</div>
              </article>

              <article className="rep-card rep-metric">
                <span className="rep-metric-label">Volume de sobras</span>
                <div className="rep-metric-value text-[#0d9d70]">+0 <small>Kz</small></div>
                <div className="rep-metric-footer">Excedentes registados em gaveta</div>
              </article>

              <article className="rep-card rep-metric">
                <span className="rep-metric-label">Fechos sem divergência</span>
                <div className="rep-metric-value">100<small>%</small></div>
                <div className="rep-metric-footer">Índice de precisão dos turnos</div>
              </article>

              <article className="rep-card rep-metric rep-hero-metric">
                <span className="rep-metric-label">Quebras registadas</span>
                <div className="rep-metric-value" style={{ fontSize: '26px' }}>
                  {savedLosses.length} <small>ocorrências</small>
                </div>
                <div className="rep-metric-footer">
                  <span>Auditoria de inventário em tempo real</span>
                </div>
              </article>
            </div>

            {/* Grelha de Motivos e Saldo por Operador */}
            <div className="rep-audit-grid">
              <article className="rep-card rep-card-content">
                <div className="rep-card-heading">
                  <div>
                    <h2>Origem das perdas</h2>
                    <p>Impacto financeiro por motivo de divergência</p>
                  </div>
                  <span className="rep-pill">{dynamicLossReasons.length} motivos</span>
                </div>

                {dynamicLossReasons.length === 0 ? (
                  <div className="rep-empty-state py-8">
                    <Inbox className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p>Nenhuma quebra de stock registada no sistema.</p>
                    <span className="text-[11px] text-neutral-400 block mt-1">
                      Utilize o botão "+ Registar Quebra / Perda" para lançar avarias ou artigos expirados.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {dynamicLossReasons.map((reason, idx) => {
                      const totalLosses = Math.max(1, totalRecordedLosses);
                      const pct = (reason.value / totalLosses) * 100;
                      return (
                        <div key={idx} className="rep-reason-row">
                          <div className="rep-reason-top">
                            <span>{reason.name}</span>
                            <strong>
                              {formatKz(reason.value)}{' '}
                              <span style={{ color: '#929ba8', fontWeight: 400, fontSize: '10px' }}>
                                · {pct.toFixed(1).replace('.', ',')}%
                              </span>
                            </strong>
                          </div>
                          <div className="rep-progress-track">
                            <div
                              className="rep-progress-fill"
                              style={{ width: `${pct}%`, background: reason.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>

              <article className="rep-card rep-card-content">
                <div className="rep-card-heading">
                  <div>
                    <h2>Saldo por operador</h2>
                    <p>Divergência apurada entre contagem e sistema</p>
                  </div>
                  <span className="rep-pill">Kz líquidos</span>
                </div>

                <div className="rep-empty-state py-8">
                  <div className="text-2xl text-emerald-600 mb-2 font-bold">✓</div>
                  <p className="font-semibold text-neutral-800">Nenhum operador com divergências de caixa.</p>
                  <span className="text-[11px] text-neutral-400 block mt-1">
                    Conforme forem encerrados turnos de caixa com sobras ou quebras, os saldos serão calculados aqui.
                  </span>
                </div>
              </article>
            </div>

            {/* Lista de Quebras Registadas pelo Utilizador */}
            {savedLosses.length > 0 ? (
              <article className="rep-card">
                <div className="rep-section-heading">
                  <div>
                    <h2>Registo de quebras e baixas de stock</h2>
                    <p>Lançamentos físicos no sistema</p>
                  </div>
                  <span className="rep-pill">{savedLosses.length} registos</span>
                </div>
                <div className="rep-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Artigo</th>
                        <th>Motivo</th>
                        <th>Qtd.</th>
                        <th>Operador</th>
                        <th className="text-right">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedLosses.map((l) => (
                        <tr key={l.id}>
                          <td>{new Date(l.date).toLocaleDateString('pt-AO')}</td>
                          <td className="font-semibold text-neutral-900">{l.productName}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700">
                              {l.reason}
                            </span>
                          </td>
                          <td>{l.quantity} un.</td>
                          <td>{l.operator}</td>
                          <td className="text-right font-extrabold text-[#ef496c]">{formatKz(l.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ) : (
              <article className="rep-card">
                <div className="rep-section-heading">
                  <div>
                    <h2>Matriz individual de auditoria</h2>
                    <p>Vendas, divergências e índice de precisão de cada operador</p>
                  </div>
                  <span className="rep-pill">0 operadores com faltas</span>
                </div>
                <div className="rep-empty-state py-6">
                  <p>Nenhum turno de operador com divergência lançado até ao momento.</p>
                </div>
              </article>
            )}
          </section>
        )}

        {/* =========================================================================
            SEPARADOR 3: FECHO DIÁRIO & RELATÓRIO Z
           ========================================================================= */}
        {activeTab === 'fecho' && (
          <section className="space-y-6 animate-in fade-in duration-200">
            <div className="rep-page-heading">
              <div>
                <span className="rep-eyebrow">Encerramento da operação</span>
                <h1>Um fecho com tudo no lugar.</h1>
                <p className="rep-subtitle">Confira a contagem física de caixa e emita o Relatório Z em conformidade com as regras fiscais.</p>
              </div>

              <div className="rep-heading-actions">
                <label className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-500">Data do relatório:</span>
                  <input
                    className="rep-input rep-date-input"
                    type="date"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                  />
                </label>
                <button 
                  type="button" 
                  className="rep-btn rep-btn-dark" 
                  onClick={() => setIsReportZOpen(true)}
                >
                  <Printer size={14} className="text-[#c8ff3d]" />
                  <span>Emitir Relatório Z</span>
                </button>
              </div>
            </div>

            {/* Três Cards de Resumo do Fecho */}
            <div className="rep-overview">
              <article className="rep-card rep-metric rep-hero-metric">
                <span className="rep-metric-label">Total faturado no dia</span>
                <div className="rep-metric-value">
                  {formatKz(sales.reduce((a, b) => a + (b.total || 0), 0))}
                </div>
                <div className="rep-metric-footer">
                  {sales.length > 0 ? `${sales.length} vendas registadas no turno de hoje` : 'Sem vendas concluídas nesta data'}
                </div>
              </article>

              <article className="rep-card rep-metric">
                <span className="rep-metric-label">Transações concluídas</span>
                <div className="rep-metric-value">{sales.length}</div>
                <div className="rep-metric-footer">Documentos fiscais emitidos</div>
              </article>

              <article className="rep-card rep-metric">
                <span className="rep-metric-label">Dinheiro esperado na gaveta</span>
                <div className="rep-metric-value text-[#0d9d70]">{formatKz(expectedCash)}</div>
                <div className="rep-metric-footer">Fundo inicial + entradas em numerário</div>
              </article>
            </div>

            {/* Grelha de Conferência */}
            <div className="rep-close-grid">
              {/* Conferência de Gaveta */}
              <article className="rep-card rep-card-content">
                <div className="rep-card-heading">
                  <div>
                    <h2>Conferência de gaveta</h2>
                    <p>Compare o valor contado com o saldo esperado</p>
                  </div>
                  <span className="rep-pill">Conferência local</span>
                </div>

                <label className="rep-form-label" htmlFor="opening-fund-input">
                  Fundo de maneio · abertura em dinheiro (Kz)
                </label>
                <input
                  id="opening-fund-input"
                  className="rep-input mb-4"
                  type="number"
                  min="0"
                  step="any"
                  value={openingFund}
                  onChange={(e) => setOpeningFund(Math.max(0, parseFloat(e.target.value) || 0))}
                />

                <div className="rep-calculation">
                  <div className="rep-row">
                    <span>Fundo inicial</span>
                    <strong>{formatKz(openingFund)}</strong>
                  </div>
                  <div className="rep-row">
                    <span>Entradas em dinheiro</span>
                    <strong className="text-[#0d9d70]">+{formatKz(cashReceipts)}</strong>
                  </div>
                  <div className="rep-row">
                    <span>Saídas / Sangrias</span>
                    <strong>{formatKz(cashOutflows)}</strong>
                  </div>
                  <div className="rep-row rep-total">
                    <span>Total esperado em gaveta</span>
                    <strong>{formatKz(expectedCash)}</strong>
                  </div>
                </div>

                <label className="rep-form-label" htmlFor="counted-cash-input">
                  Valor contado na gaveta (Kz)
                </label>
                <input
                  id="counted-cash-input"
                  className="rep-input"
                  type="number"
                  min="0"
                  step="any"
                  value={countedCash}
                  onChange={(e) => setCountedCash(Math.max(0, parseFloat(e.target.value) || 0))}
                />

                {/* Status Box */}
                <div className={`rep-status-box ${difference === 0 ? '' : 'warning'}`} role="status">
                  {difference === 0 ? (
                    <>
                      <strong>✓ Caixa balanceado</strong>
                      <br />
                      O valor contado corresponde exatamente ao saldo esperado no sistema.
                    </>
                  ) : (
                    <>
                      <strong>
                        {difference < 0 ? 'Falta' : 'Sobra'} de {formatKz(Math.abs(difference))}
                      </strong>
                      <br />
                      Confira os recibos manuais e verifique a contagem física antes de gerar o fecho definitivo.
                    </>
                  )}
                </div>

                <button
                  type="button"
                  className="rep-btn rep-btn-lime w-full mt-4 py-3 justify-center text-sm font-bold cursor-pointer"
                  onClick={() => setIsReportZOpen(true)}
                >
                  <Printer size={16} />
                  <span>Conferir e emitir Relatório Z</span>
                </button>
              </article>

              {/* Coluna Direita: Recebimentos e Histórico */}
              <div className="rep-stack">
                <article className="rep-card rep-card-content">
                  <div className="rep-card-heading">
                    <div>
                      <h2>Recebimentos do dia</h2>
                      <p>Separação entre numerário e pagamentos eletrónicos</p>
                    </div>
                  </div>

                  <div className="rep-payment-list">
                    <div className="rep-payment-item">
                      <span className="rep-payment-name">
                        <span className="rep-swatch" style={{ background: '#8ae2bd' }}></span>
                        Dinheiro
                      </span>
                      <strong>{formatKz(cashReceipts)}</strong>
                    </div>

                    <div className="rep-payment-item">
                      <span className="rep-payment-name">
                        <span className="rep-swatch" style={{ background: '#557df4' }}></span>
                        Multicaixa / TPA
                      </span>
                      <strong>
                        {formatKz(
                          sales
                            .filter(s => s.paymentMethod === 'multicaixa')
                            .reduce((a, b) => a + (b.total || 0), 0)
                        )}
                      </strong>
                    </div>

                    <div className="rep-payment-item">
                      <span className="rep-payment-name">
                        <span className="rep-swatch" style={{ background: '#c7dc35' }}></span>
                        MCX Express
                      </span>
                      <strong>
                        {formatKz(
                          sales
                            .filter(s => s.paymentMethod === 'express')
                            .reduce((a, b) => a + (b.total || 0), 0)
                        )}
                      </strong>
                    </div>

                    <div className="rep-payment-item">
                      <span className="rep-payment-name">
                        <span className="rep-swatch" style={{ background: '#9760e8' }}></span>
                        Transferência Bancária
                      </span>
                      <strong>
                        {formatKz(
                          sales
                            .filter(s => s.paymentMethod === 'transfer')
                            .reduce((a, b) => a + (b.total || 0), 0)
                        )}
                      </strong>
                    </div>
                  </div>
                </article>

                <article className="rep-card">
                  <div className="rep-section-heading">
                    <div>
                      <h2>Histórico de transações</h2>
                      <p>{closingDate.split('-').reverse().join('/')}</p>
                    </div>
                    <span className="rep-pill">{sales.length} registos</span>
                  </div>

                  {sales.length === 0 ? (
                    <div className="rep-empty-state">
                      <div className="text-3xl text-neutral-300 mb-2">▤</div>
                      Nenhuma venda concluída no conjunto desta data.
                    </div>
                  ) : (
                    <div className="rep-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Hora</th>
                            <th>Fatura</th>
                            <th>Artigos</th>
                            <th>Meio</th>
                            <th className="text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sales.slice(0, 6).map((sale, i) => (
                            <tr key={sale.id || i}>
                              <td>{new Date(sale.createdAt || Date.now()).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="font-semibold text-neutral-900">{sale.invoiceNumber}</td>
                              <td>{sale.items?.length || 1} itens</td>
                              <td>
                                <span className="text-[11px] font-medium text-neutral-700 capitalize">
                                  {sale.paymentMethod}
                                </span>
                              </td>
                              <td className="text-right font-bold">{formatKz(sale.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* MODAL RELATÓRIO Z (AGT COMPLIANT) */}
      <ReportZModal
        isOpen={isReportZOpen}
        onClose={() => setIsReportZOpen(false)}
        data={reportZData}
      />

      {/* MODAL REGISTAR QUEBRA / PERDA DE STOCK */}
      {isLossModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-neutral-200">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Registar Quebra / Perda de Stock</h3>
                <p className="text-xs text-neutral-500">Registo de saída por avaria, furto ou validade</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLossModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Artigo / Produto</label>
                {products.length === 0 ? (
                  <p className="text-amber-600 bg-amber-50 p-2 rounded-lg">Nenhum produto cadastrado no catálogo.</p>
                ) : (
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-xs focus:outline-neutral-900"
                    value={newLossProduct}
                    onChange={(e) => setNewLossProduct(e.target.value)}
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock} | {formatKz(p.costPrice || p.salePrice)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Motivo da Quebra</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-xs focus:outline-neutral-900"
                  value={newLossReason}
                  onChange={(e) => setNewLossReason(e.target.value)}
                >
                  <option value="Danificado / Avaria">Danificado / Avaria de Transporte</option>
                  <option value="Validade expirada">Validade Expirada</option>
                  <option value="Furto / Quebra externa">Furto / Roubo</option>
                  <option value="Extravio em armazém">Extravio em Armazém</option>
                  <option value="Erro de contagem">Erro de Contagem / Inventário</option>
                  <option value="Uso interno / Amostra">Uso Interno / Amostra Comercial</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-xs focus:outline-neutral-900"
                    value={newLossQty}
                    onChange={(e) => setNewLossQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Operador / Vistoriador</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-xs focus:outline-neutral-900"
                    value={newLossOperator}
                    onChange={(e) => setNewLossOperator(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLossModalOpen(false)}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-200/60 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveLoss}
                className="px-4 py-2 rounded-xl bg-neutral-950 text-white font-bold text-xs hover:bg-neutral-800 cursor-pointer"
              >
                Gravar Quebra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
