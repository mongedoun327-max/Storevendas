import React from 'react';
import { PauseCircle, Play, Trash2, X, Clock, User, ShoppingBag } from 'lucide-react';
import { CartItem } from '../../types';
import { formatKz, formatDateTime } from '../../utils/formatters';

export interface HeldSale {
  id: string;
  heldAt: string;
  customerName: string;
  customerNif?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
}

interface PosHeldSalesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  heldSales: HeldSale[];
  onResumeSale: (heldSale: HeldSale) => void;
  onDeleteHeldSale: (heldSaleId: string) => void;
}

export const PosHeldSalesDrawer: React.FC<PosHeldSalesDrawerProps> = ({
  isOpen,
  onClose,
  heldSales,
  onResumeSale,
  onDeleteHeldSale,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-end animate-in fade-in duration-150">
      <div className="bg-white h-full w-full max-w-md shadow-2xl border-l border-zinc-200 flex flex-col justify-between p-6 animate-in slide-in-from-right duration-200 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center">
              <PauseCircle size={22} />
            </div>
            <div>
              <h3 className="font-black text-sm text-zinc-950">Vendas em Espera (Parked)</h3>
              <p className="text-[11px] text-zinc-400">
                {heldSales.length} {heldSales.length === 1 ? 'venda pausada' : 'vendas pausadas'} no caixa
              </p>
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

        {/* Content List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
          {heldSales.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-300">
                <ShoppingBag size={24} />
              </div>
              <p className="font-bold text-xs text-zinc-700">Nenhuma venda em espera</p>
              <p className="text-[11px] text-zinc-400 max-w-xs">
                Ao atender vários clientes em simultâneo, utilize o botão "Pausar Venda" no carrinho para guardar os itens e retomar depois.
              </p>
            </div>
          ) : (
            heldSales.map((sale) => {
              const totalItems = sale.items.reduce((acc, ci) => acc + ci.quantity, 0);

              return (
                <div
                  key={sale.id}
                  className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 hover:border-amber-400/80 transition-all space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-zinc-900 text-xs">
                        <User size={13} className="text-zinc-500" />
                        <span>{sale.customerName || 'Consumidor Final'}</span>
                        {sale.customerNif && (
                          <span className="text-[10px] text-zinc-400 font-mono">({sale.customerNif})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                        <Clock size={11} />
                        <span>Pausada às {formatDateTime(sale.heldAt)}</span>
                      </div>
                    </div>
                    <span className="text-emerald-700 font-black text-sm">{formatKz(sale.total)}</span>
                  </div>

                  {/* Summary of Items */}
                  <div className="p-2.5 rounded-xl bg-white border border-zinc-100 space-y-1 text-[11px]">
                    <div className="flex justify-between text-zinc-500 font-semibold">
                      <span>Artigos ({totalItems}):</span>
                      <span className="truncate max-w-[180px]">
                        {sale.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onDeleteHeldSale(sale.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Excluir Venda Pausada"
                    >
                      <Trash2 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onResumeSale(sale)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                    >
                      <Play size={13} className="fill-current" />
                      <span>Retomar no Caixa</span>
                    </button>
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
            Fechar Janela [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
