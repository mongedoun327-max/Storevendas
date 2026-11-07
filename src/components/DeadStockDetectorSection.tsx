import React, { useState } from 'react';
import { PackageX, AlertTriangle, RefreshCw, ArrowDownRight, Tag, FileDown } from 'lucide-react';
import { useDeadStock, DeadStockItem } from '../hooks/useDeadStock';
import { generateIntelligencePDF } from '../utils/exportPdf';
import { formatKz } from '../utils/formatters';

export default function DeadStockDetectorSection() {
  const { items, totalCapitalLocked, loading, refresh } = useDeadStock();
  const [minDaysFilter, setMinDaysFilter] = useState<number>(30);

  const filteredItems = items.filter(item => item.days_inactive >= minDaysFilter);

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

  const handleExportFilteredPDF = () => {
    generateIntelligencePDF({
      metrics: {
        averageTicket: '0 Kz',
        deadStockCapital: formatKz(totalCapitalLocked),
        deadStockCount: filteredItems.length,
        grossMargin: '0%',
        repurchaseAlertCount: `${filteredItems.length} Produtos`,
      },
      aiInsight: `Filtro de Inatividade aplicado: Produtos parados há mais de ${minDaysFilter} dias. Recomenda-se acionar promoções ou combos de liquidação imediata.`,
      deadStockItems: filteredItems,
    });
  };

  const getActionBadge = (action: DeadStockItem['suggested_action']) => {
    switch (action) {
      case 'LIQUIDATION':
        return <span className="px-3 py-1 bg-red-100 text-red-800 font-black text-[10px] rounded-lg">Liquidação (-30%)</span>;
      case 'COMBO':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 font-black text-[10px] rounded-lg">Criar Combo</span>;
      default:
        return <span className="px-3 py-1 bg-[#E1FB15] text-[#131313] font-black text-[10px] rounded-lg border border-[#131313]/10">Desconto 15%</span>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[6px_6px_18px_rgba(0,0,0,0.03)] space-y-5">
      
      {/* Cabeçalho e Métricas do Detector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <PackageX size={22} />
          </div>
          <div>
            <h2 className="text-base font-black text-[#131313]">Detector de Produtos Encalhados</h2>
            <p className="text-xs text-gray-500 font-medium">Itens sem rotação de estoque há mais de 30 dias</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Card de Capital Parado */}
          <div className="bg-amber-50/60 px-4 py-2 rounded-2xl border border-amber-100 text-right">
            <span className="text-[10px] font-bold text-amber-700 block uppercase">Capital Imobilizado</span>
            <span className="text-sm font-black text-amber-900">{formatCurrency(totalCapitalLocked)}</span>
          </div>

          <button
            type="button"
            onClick={handleExportFilteredPDF}
            className="flex items-center gap-1 px-3 py-2 bg-[#131313] hover:bg-black text-[#E1FB15] font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            title="Exportar Lista Filtrada em PDF"
          >
            <FileDown size={14} />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            type="button"
            onClick={refresh}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition cursor-pointer"
            title="Atualizar Análise"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filtros por Grau de Estagnação */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500">Filtrar por inatividade:</span>
        {[30, 60, 90].map((days) => (
          <button
            key={days}
            onClick={() => setMinDaysFilter(days)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              minDaysFilter === days
                ? 'bg-[#131313] text-[#E1FB15]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            +{days} Dias
          </button>
        ))}
      </div>

      {/* Tabela de Resultados */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-400 font-bold border-b border-gray-100">
              <th className="pb-3">Produto / Código</th>
              <th className="pb-3">Estoque</th>
              <th className="pb-3">Preço Custo</th>
              <th className="pb-3">Capital Parado</th>
              <th className="pb-3">Dias Parado</th>
              <th className="pb-3 text-right">Recomendação Automática</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                  {loading ? 'Analisando histórico de vendas...' : 'Nenhum produto encalhado para o filtro selecionado.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.product_id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3.5">
                    <div className="font-bold text-[#131313]">{item.product_name}</div>
                    <div className="text-[10px] font-mono text-gray-400">{item.barcode || 'S/ BARRAS'}</div>
                  </td>
                  <td className="py-3.5 font-bold text-gray-700">{item.stock_quantity} Unid.</td>
                  <td className="py-3.5 text-gray-600">{formatCurrency(item.cost_price)}</td>
                  <td className="py-3.5 font-bold text-amber-600">{formatCurrency(item.capital_locked)}</td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-1 font-bold text-gray-800">
                      <ArrowDownRight size={14} className="text-amber-500" />
                      {item.days_inactive} dias
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {getActionBadge(item.suggested_action)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DeadStockDetectorSection };
