import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, DollarSign, PieChart as PieIcon, BarChart3, 
  Calendar, ArrowUpRight, ArrowDownRight, Clock, CreditCard, Wallet 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Tipagem dos Dados Horários
interface HourlyPerformanceData {
  hour: string;
  revenue: number;
  profit: number;
}

// Tipagem dos Meios de Pagamento
interface PaymentMethodData {
  method: string;
  amount: number;
  percentage: number;
  color: string;
}

export default function ReportsScreen() {
  const [period, setPeriod] = useState<'HOJE' | '7D' | '30D' | '6M'>('HOJE');
  const [loading, setLoading] = useState(false);
  const [activeBarHover, setActiveBarHover] = useState<number | null>(null);
  const [activeLineHover, setActiveLineHover] = useState<number | null>(null);
  const [activePieHover, setActivePieHover] = useState<number | null>(null);
  const [isUserHovering, setIsUserHovering] = useState(false);

  // -------------------------------------------------------------
  // DADOS 1: EVOLUÇÃO DE VENDAS E LUCRO POR HORA (Colunas & Linhas)
  // -------------------------------------------------------------
  const [hourlyData, setHourlyData] = useState<HourlyPerformanceData[]>([
    { hour: '08:00', revenue: 45000,  profit: 18000 },
    { hour: '10:00', revenue: 120000, profit: 52000 },
    { hour: '12:00', revenue: 310000, profit: 140000 },
    { hour: '14:00', revenue: 240000, profit: 105000 },
    { hour: '16:00', revenue: 180000, profit: 78000 },
    { hour: '18:00', revenue: 420000, profit: 190000 },
    { hour: '20:00', revenue: 290000, profit: 125000 },
  ]);

  // -------------------------------------------------------------
  // DADOS 2: MEIOS DE PAGAMENTO (Gráfico em Pizza)
  // -------------------------------------------------------------
  const [paymentData, setPaymentData] = useState<PaymentMethodData[]>([
    { method: 'Multicaixa / TPA', amount: 850000, percentage: 53, color: '#131313' },
    { method: 'Dinheiro (Cash)', amount: 420000, percentage: 26, color: '#32D583' },
    { method: 'MCX Express',     amount: 210000, percentage: 13, color: '#E1FB15' },
    { method: 'Transferência',   amount: 125000, percentage: 8,  color: '#3B82F6' },
  ]);

  // Animação Autônoma dos Gráficos (percorre colunas e pizza automaticamente)
  useEffect(() => {
    if (isUserHovering) return;
    const interval = setInterval(() => {
      setActiveBarHover((prev) => (prev === null ? 0 : (prev + 1) % hourlyData.length));
      setActivePieHover((prev) => (prev === null ? 0 : (prev + 1) % paymentData.length));
    }, 2800);

    return () => clearInterval(interval);
  }, [isUserHovering, hourlyData.length, paymentData.length]);

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);

    // 1. Buscar Dados Horários no Supabase
    const { data: hourlyRows } = await supabase
      .from('vw_hourly_sales_performance')
      .select('*');

    if (hourlyRows && hourlyRows.length > 0) {
      setHourlyData(
        hourlyRows.map(row => ({
          hour: row.hour_label,
          revenue: Number(row.total_revenue),
          profit: Number(row.gross_profit)
        }))
      );
    }

    // 2. Buscar Meios de Pagamento no Supabase
    const { data: payRows } = await supabase
      .from('vw_payment_methods_summary')
      .select('*');

    if (payRows && payRows.length > 0) {
      const totalPay = payRows.reduce((a, b) => a + Number(b.total_amount), 0);
      const colorMap: Record<string, string> = {
        MULTICAIXA: '#131313',
        CASH: '#32D583',
        EXPRESS: '#E1FB15',
        TRANSFER: '#3B82F6'
      };

      setPaymentData(
        payRows.map(row => ({
          method: row.payment_method,
          amount: Number(row.total_amount),
          percentage: totalPay > 0 ? Math.round((Number(row.total_amount) / totalPay) * 100) : 0,
          color: colorMap[row.payment_method] || '#94A3B8'
        }))
      );
    }

    setLoading(false);
  };

  // Métricas Totais do Dia/Período
  const totalRevenue = hourlyData.reduce((acc, item) => acc + item.revenue, 0);
  const totalProfit  = hourlyData.reduce((acc, item) => acc + item.profit, 0);
  const maxRevenue   = Math.max(...hourlyData.map(d => d.revenue), 1);
  const maxProfit    = Math.max(...hourlyData.map(d => d.profit), 1);

  // =============================================================
  // CÁLCULOS DO GRÁFICO EM PIZZA / DONUT (SVG Pure Render)
  // =============================================================
  const renderPieChartSlices = () => {
    let cumulativePercent = 0;
    const size = 180;
    const center = size / 2;
    const radius = 65;
    const circumference = 2 * Math.PI * radius;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {paymentData.map((item, index) => {
          const dashLength = (item.percentage * circumference) / 100;
          const strokeDasharray = `${dashLength} ${circumference}`;
          const strokeDashoffset = -((cumulativePercent * circumference) / 100);
          cumulativePercent += item.percentage;

          const isActive = activePieHover === index;
          const isDimmed = activePieHover !== null && !isActive;

          return (
            <motion.circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="cursor-pointer"
              onMouseEnter={() => setActivePieHover(index)}
              onMouseLeave={() => setActivePieHover(null)}
              initial={{ strokeWidth: 0, opacity: 0 }}
              animate={{ 
                strokeWidth: isActive ? 30 : 24, 
                opacity: isDimmed ? 0.35 : 1 
              }}
              transition={{ 
                strokeWidth: { type: 'spring', stiffness: 300, damping: 20 },
                opacity: { duration: 0.35, delay: index * 0.15 }
              }}
              style={{ transformOrigin: `${center}px ${center}px` }}
            />
          );
        })}
      </svg>
    );
  };

  // =============================================================
  // CÁLCULOS DO GRÁFICO DE LINHAS (Lucro por Hora)
  // =============================================================
  const lineSvgWidth = 600;
  const lineSvgHeight = 180;
  const linePadding = 35;

  const linePoints = hourlyData.map((d, i) => {
    const x = linePadding + (i * (lineSvgWidth - linePadding * 2)) / (hourlyData.length - 1 || 1);
    const y = lineSvgHeight - linePadding - (d.profit / maxProfit) * (lineSvgHeight - linePadding * 2);
    return { x, y, profit: d.profit, hour: d.hour };
  });

  // Curva cúbica suave para uma leitura mais minimalista e orgânica.
  const pathD = linePoints.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;

    const previous = linePoints[i - 1];
    const midpointX = (previous.x + pt.x) / 2;
    return `${acc} C ${midpointX},${previous.y} ${midpointX},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaD = linePoints.length > 0
    ? `${pathD} L ${linePoints[linePoints.length - 1].x},${lineSvgHeight - linePadding} L ${linePoints[0].x},${lineSvgHeight - linePadding} Z`
    : '';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[#131313]">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Relatórios Operacionais</h1>
          <p className="text-xs text-gray-500 font-medium">Análise temporal de vendas por hora, distribuição de lucros e pagamentos</p>
        </div>

        {/* Filtro de Período */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl">
          {(['HOJE', '7D', '30D', '6M'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                period === p 
                  ? 'bg-[#131313] text-[#E1FB15] shadow-sm' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Sumário rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total de Vendas no Período</p>
            <p className="text-2xl font-black text-black mt-1">
              {totalRevenue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </p>
          </div>
          <div className="p-3 bg-gray-100 text-black rounded-2xl"><BarChart3 size={24} /></div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lucro Acumulado</p>
            <p className="text-2xl font-black text-[#32D583] mt-1">
              {totalProfit.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><TrendingUp size={24} /></div>
        </div>

        <div className="bg-[#131313] text-white p-5 rounded-3xl shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-[#E1FB15] font-bold uppercase tracking-wider">Margem de Lucro</p>
            <p className="text-2xl font-black mt-1">
              {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'}%
            </p>
          </div>
          <div className="p-3 bg-white/10 text-[#E1FB15] rounded-2xl"><DollarSign size={24} /></div>
        </div>
      </div>

      {/* SEÇÃO DOS GRÁFICOS HORÁRIOS: COLUNAS + LINHAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. GRÁFICO DE EVOLUÇÃO DE VENDAS (COLUNAS / BARRAS POR HORA) */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <h3 className="text-sm font-black text-gray-900">Evolução de Vendas por Hora</h3>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Variação dos valores de vendas ao longo do dia (Kz)</p>
            </div>
            <span className="text-[10px] font-black bg-black text-[#E1FB15] px-2.5 py-1 rounded-lg">Colunas</span>
          </div>

          {/* Renderização em Colunas de SVG */}
          <div 
            className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-gray-100 px-2"
            onMouseEnter={() => setIsUserHovering(true)}
            onMouseLeave={() => setIsUserHovering(false)}
          >
            {hourlyData.map((item, idx) => {
              const heightPercent = Math.max((item.revenue / maxRevenue) * 100, 8);
              const isHovered = activeBarHover === idx;

              return (
                <div 
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setActiveBarHover(idx)}
                  onMouseLeave={() => setActiveBarHover(null)}
                >
                  {/* Tooltip de Valor em Hover */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      className="absolute -top-10 bg-[#131313] text-[#E1FB15] text-[10px] font-black py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-10"
                    >
                      {item.revenue.toLocaleString()} Kz
                    </motion.div>
                  )}

                  {/* Barra / Coluna */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 120, 
                      damping: 16, 
                      delay: idx * 0.08 
                    }}
                    whileHover={{ scaleY: 1.04, scaleX: 1.08 }}
                    style={{ transformOrigin: 'bottom' }}
                    className={`w-full max-w-[36px] rounded-t-xl ${
                      isHovered 
                        ? 'bg-[#E1FB15] border-2 border-black shadow-[0_0_0_4px_rgba(225,251,21,0.15)]' 
                        : 'bg-[#131313]'
                    }`}
                  />

                  {/* Rótulo de Hora */}
                  <span className={`text-[10px] font-bold mt-2 transition-colors ${isHovered ? 'text-black' : 'text-gray-400'}`}>{item.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. GRÁFICO DE EVOLUÇÃO DE LUCRO (LINHAS POR HORA) */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#32D583]" />
                <h3 className="text-sm font-black text-gray-900">Evolução do Lucro por Hora</h3>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Variação do lucro líquido apurado em cada horário (Kz)</p>
            </div>
            <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg">Linhas</span>
          </div>

          {/* Renderização da Linha SVG */}
          <div className="relative w-full overflow-x-auto">
            <svg viewBox={`0 0 ${lineSvgWidth} ${lineSvgHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="profitAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#32D583" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#32D583" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Guia Horizontais */}
              {[0, 0.5, 1].map((r, i) => {
                const y = lineSvgHeight - linePadding - r * (lineSvgHeight - linePadding * 2);
                return <line key={i} x1={linePadding} y1={y} x2={lineSvgWidth - linePadding} y2={y} stroke="#F5F7F8" strokeWidth="1" />;
              })}

              {/* Área Sombreada */}
              <motion.path 
                d={areaD} 
                fill="url(#profitAreaGrad)" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9, ease: 'easeOut' }}
              />

              {/* Linha Contínua */}
              <motion.path 
                d={pathD} 
                fill="none" 
                stroke="#32D583" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />

              {/* Pontos de Interação por Hora */}
              {linePoints.map((pt, idx) => (
                <g 
                  key={idx} 
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveLineHover(idx)}
                  onMouseLeave={() => setActiveLineHover(null)}
                >
                  {/* Área de captura de hover invisível para melhor interação */}
                  <rect x={pt.x - 20} y={0} width="40" height={lineSvgHeight} fill="transparent" />

                  {/* Halo pulsante no ponto ativo */}
                  {activeLineHover === idx && (
                    <motion.circle
                      cx={pt.x} cy={pt.y}
                      fill="#32D583" fillOpacity={0.25}
                      initial={{ r: 4 }}
                      animate={{ r: 12 }}
                      transition={{ duration: 0.9, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                    />
                  )}

                  <motion.circle 
                    cx={pt.x} cy={pt.y} r="4" 
                    fill="#32D583" stroke="#FFFFFF" strokeWidth="2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: activeLineHover === idx ? 1.5 : 1, opacity: 1 }}
                    transition={{ 
                      scale: activeLineHover === idx 
                        ? { type: 'spring', stiffness: 400, damping: 15 } 
                        : { delay: 0.6 + idx * 0.08, type: 'spring', stiffness: 300, damping: 18 },
                      opacity: { delay: 0.6 + idx * 0.08 }
                    }}
                    style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                  />

                  {/* Rótulo Eixo X */}
                  <text x={pt.x} y={lineSvgHeight - 8} textAnchor="middle" className="text-[10px] fill-gray-400 font-bold">
                    {pt.hour}
                  </text>

                  {/* Tooltip Hover */}
                  {activeLineHover === idx && (
                    <g>
                      <rect x={pt.x - 50} y={pt.y - 45} width="100" height="32" rx="8" fill="#131313" />
                      <text x={pt.x} y={pt.y - 24} textAnchor="middle" fill="#32D583" className="text-[9px] font-black">
                        Lucro: {pt.profit.toLocaleString()} Kz
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

      </div>

      {/* 3. GRÁFICO DE MEIOS DE PAGAMENTO (GRÁFICO EM PIZZA / DONUT) */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <PieIcon size={16} className="text-black" />
            <h3 className="text-sm font-black text-gray-900">Distribuição por Meios de Pagamento</h3>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Proporção de vendas divididas por forma de pagamento no caixa</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-around gap-6 pt-2">
          
          {/* Gráfico Donut/Pizza SVG */}
          <div className="relative flex items-center justify-center">
            {renderPieChartSlices()}
            <div className="absolute text-center">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase">Total</p>
              <p className="text-xs font-black text-black">100%</p>
            </div>
          </div>

          {/* Legenda e Detalhamento em Lista */}
          <div className="w-full md:w-1/2 space-y-3">
            {paymentData.map((item, i) => (
              <motion.div 
                key={i} 
                onMouseEnter={() => setActivePieHover(i)}
                onMouseLeave={() => setActivePieHover(null)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: activePieHover !== null && activePieHover !== i ? 0.5 : 1, 
                  x: 0,
                  scale: activePieHover === i ? 1.02 : 1,
                }}
                transition={{ 
                  opacity: { duration: 0.3, delay: i * 0.1 }, 
                  x: { duration: 0.3, delay: i * 0.1 },
                  scale: { type: 'spring', stiffness: 400, damping: 22 },
                }}
                className={`flex items-center justify-between text-xs p-2.5 rounded-2xl cursor-pointer transition-colors ${
                  activePieHover === i ? 'bg-gray-100 ring-1 ring-gray-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <motion.span 
                    className="w-3.5 h-3.5 rounded-md" 
                    style={{ backgroundColor: item.color }}
                    animate={{ scale: activePieHover === i ? 1.3 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  />
                  <span className="font-bold text-gray-800">{item.method}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-black mr-2">{item.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-white rounded-md border text-gray-600">
                    {item.percentage}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
}
