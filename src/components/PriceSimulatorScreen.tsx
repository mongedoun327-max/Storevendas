import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, ArrowRight, Sparkles } from 'lucide-react';
import { formatKz } from '../utils/formatters';

export default function PriceSimulatorScreen() {
  const [costPrice, setCostPrice] = useState<number>(2000);
  const [currentPrice, setCurrentPrice] = useState<number>(3500);
  const [simulatedPrice, setSimulatedPrice] = useState<number>(4000);
  const [vatRate, setVatRate] = useState<number>(14);
  const [monthlySalesVolume, setMonthlySalesVolume] = useState<number>(150);

  // Cálculos Atuais
  const currentMargin = currentPrice > 0 ? ((currentPrice - costPrice) / currentPrice) * 100 : 0;
  const currentProfitTotal = (currentPrice - costPrice) * monthlySalesVolume;

  // Cálculos Simulados
  const simulatedMargin = simulatedPrice > 0 ? ((simulatedPrice - costPrice) / simulatedPrice) * 100 : 0;
  const simulatedProfitTotal = (simulatedPrice - costPrice) * monthlySalesVolume;
  const profitDifference = simulatedProfitTotal - currentProfitTotal;

  return (
    <div className="w-full min-h-screen bg-white text-[#131313] p-6 md:p-8 space-y-6">
      
      <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
        <div className="p-3 bg-[#131313] text-[#E1FB15] rounded-2xl shadow-md">
          <Calculator size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#131313] tracking-tight">
            Simulador de Preços & Margens
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Analise a variação de lucro e margem de contribuição antes de alterar os preços
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Painel de Parâmetros */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[6px_6px_18px_rgba(0,0,0,0.03)] space-y-4">
          <h2 className="text-sm font-black border-b border-gray-100 pb-2 text-[#131313] flex items-center justify-between">
            <span>Parâmetros do Produto</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Entrada de Dados</span>
          </h2>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Preço de Custo (Kz)</label>
            <input
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:border-[#131313] transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Preço Atual de Venda (Kz)</label>
            <input
              type="number"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(Number(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:border-[#131313] transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Novo Preço Simulado (Kz)</label>
            <input
              type="number"
              value={simulatedPrice}
              onChange={(e) => setSimulatedPrice(Number(e.target.value))}
              className="w-full p-3 bg-[#E1FB15]/20 border border-[#E1FB15] rounded-xl font-black text-xs text-[#131313] outline-none focus:ring-2 focus:ring-[#131313]/20 transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Vendas Mensais Estimadas (Unidades)</label>
            <input
              type="number"
              value={monthlySalesVolume}
              onChange={(e) => setMonthlySalesVolume(Number(e.target.value))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:border-[#131313] transition"
            />
          </div>
        </div>

        {/* Painel de Comparação Preditiva */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[6px_6px_18px_rgba(0,0,0,0.03)] space-y-5 flex flex-col justify-between">
          <h2 className="text-sm font-black border-b border-gray-100 pb-2 text-[#131313] flex items-center justify-between">
            <span>Resultado Comparativo</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Cálculo em Tempo Real</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Margem Atual</span>
              <p className="text-xl font-black text-gray-800">{currentMargin.toFixed(1)}%</p>
              <p className="text-[10px] text-gray-500 font-medium">Lucro/unid: {(currentPrice - costPrice).toLocaleString('pt-AO')} Kz</p>
            </div>

            <div className="p-4 bg-[#32D583]/10 rounded-2xl border border-[#32D583]/30 space-y-1">
              <span className="text-[10px] font-bold text-[#32D583] uppercase">Margem Simulada</span>
              <p className="text-xl font-black text-gray-900">{simulatedMargin.toFixed(1)}%</p>
              <p className="text-[10px] text-gray-600 font-medium">Lucro/unid: {(simulatedPrice - costPrice).toLocaleString('pt-AO')} Kz</p>
            </div>
          </div>

          <div className="p-5 bg-[#131313] text-white rounded-2xl space-y-2 shadow-md">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-medium">Impacto no Lucro Mensal:</span>
              <span className={`font-black text-sm ${profitDifference >= 0 ? 'text-[#32D583]' : 'text-red-400'}`}>
                {profitDifference >= 0 ? '+' : ''}{profitDifference.toLocaleString('pt-AO')} Kz
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              Com base no volume estimado de {monthlySalesVolume} unidades/mês.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export { PriceSimulatorScreen };
