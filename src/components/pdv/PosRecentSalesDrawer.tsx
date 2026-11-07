import React, { useState } from 'react';
import { 
  Receipt, 
  Printer, 
  RotateCcw, 
  X, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { SaleTransaction } from '../../types';
import { formatKz, formatDateTime } from '../../utils/formatters';

interface PosRecentSalesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleTransaction[];
  onReprintSale: (sale: SaleTransaction) => void;
  onRequestRefund: (sale: SaleTransaction) => void;
}

export const PosRecentSalesDrawer: React.FC<PosRecentSalesDrawerProps> = ({
  isOpen,
  onClose,
  sales,
  onReprintSale,
  onRequestRefund,
}) => {
  const [filterTerm, setFilterTerm] = useState('');

  if (!isOpen) return null;

  const filteredSales = sales.filter((s) => {
    if (!filterTerm.trim()) return true;
    const term = filterTerm.toLowerCase();
    return (
      s.invoiceNumber.toLowerCase().includes(term) ||
      s.customerName.toLowerCase().includes(term) ||
      (s.customerNif && s.customerNif.includes(term))
    );
  }).slice(0, 30);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-end animate-in fade-in duration-150">
      <div className="bg-white h-full w-full max-w-lg shadow-2xl border-l border-zinc-200 flex flex-col justify-between p-6 animate-in slide-in-from-right duration-200 text-xs">
        {/* Header */}
        <div className="space-y-3 pb-4 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
                <Receipt size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm text-zinc-950">Histórico de Vendas Recentes</h3>
                <p className="text-[11px] text-zinc-400">Reimpressão de talões fiscais e estornos com PIN de gerente</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Pesquisar por nº de fatura (FT...), cliente ou NIF..."
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950"
            />
          </div>
        </div>

        {/* Sales List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
          {filteredSales.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-300">
                <Receipt size={24} />
              </div>
              <p className="font-bold text-xs text-zinc-700">Nenhuma venda encontrada</p>
              <p className="text-[11px] text-zinc-400">As vendas finalizadas neste terminal aparecerão aqui para consulta e reimpressão.</p>
            </div>
          ) : (
            filteredSales.map((sale) => {
              const isCanceled = sale.status === 'canceled';
              const totalItems = sale.items.reduce((acc, ci) => acc + ci.quantity, 0);

              return (
                <div
                  key={sale.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    isCanceled
                      ? 'bg-rose-50/40 border-rose-200 opacity-75'
                      : 'bg-zinc-50 border-zinc-200/80 hover:border-zinc-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-zinc-950 text-xs">{sale.invoiceNumber}</span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isCanceled
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCanceled ? 'Estornada / Cancelada' : 'Paga • Concluída'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-600 font-semibold mt-1">
                        <User size={12} className="text-zinc-400" />
                        <span>{sale.customerName}</span>
                        {sale.customerNif && <span className="text-[10px] text-zinc-400 font-mono">({sale.customerNif})</span>}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                        <Clock size={10} />
                        <span>{formatDateTime(sale.createdAt)}</span>
                        <span>•</span>
                        <span className="capitalize">{sale.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-zinc-950 font-black text-sm block">{formatKz(sale.total)}</span>
                      <span className="text-[10px] text-zinc-400">{totalItems} itens</span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="p-2 bg-white/80 rounded-xl border border-zinc-100 text-[10px] text-zinc-600 truncate">
                    {sale.items.map(item => `${item.quantity}x ${item.product.name}`).join(' | ')}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => onReprintSale(sale)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer size={13} />
                      <span>Ver / Reimprimir Talão</span>
                    </button>

                    {!isCanceled && (
                      <button
                        type="button"
                        onClick={() => onRequestRefund(sale)}
                        className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Estornar venda e devolver estoque (Requer PIN de Gerente)"
                      >
                        <RotateCcw size={12} />
                        <span>Estorno</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold transition-colors cursor-pointer"
          >
            Voltar ao Caixa [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
