import React, { useState } from 'react';
import { 
  X, 
  Boxes, 
  Plus, 
  Minus, 
  Search, 
  Check, 
  AlertTriangle, 
  Building2, 
  Calendar 
} from 'lucide-react';
import { Product } from '../../types';
import { formatKz } from '../../utils/formatters';

interface InventoryQuickStockModalProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onApplyStockEntry: (productId: string, qtyAdded: number, reason: string, supplier?: string, newBatch?: string) => void;
}

export const InventoryQuickStockModal: React.FC<InventoryQuickStockModalProps> = ({
  isOpen,
  products,
  onClose,
  onApplyStockEntry,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [searchFilter, setSearchFilter] = useState('');
  const [quantity, setQuantity] = useState<string>('10');
  const [supplier, setSupplier] = useState('');
  const [batch, setBatch] = useState(`L-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [reason, setReason] = useState('Entrada de Mercadoria / Compra');

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  const filteredProducts = products.filter(p => 
    !searchFilter ||
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.barcode.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity) || 0;
    if (qty <= 0 || !selectedProduct) return;

    onApplyStockEntry(selectedProduct.id, qty, reason, supplier, batch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)]">
              <Boxes size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Entrada Rápida de Estoque</h2>
              <p className="text-xs text-[var(--text-secondary)]">Reposição de estoque e registro de novo lote de fornecedor</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-control)] text-[var(--text-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 bg-white">
          
          {/* Seletor com Busca de Produto */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-1.5 block">
              Selecionar Artigo / Produto para Repor:
            </label>
            
            <div className="space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Pesquisar produto por nome ou SKU..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-[var(--surface-subtle)] focus:bg-white border border-[var(--line)] rounded-[var(--radius-control)] pl-9 pr-3 py-2 text-xs text-[var(--ink)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--line-strong)]"
                />
              </div>

              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-[var(--surface-subtle)] focus:bg-white border border-[var(--line)] rounded-[var(--radius-control)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--line-strong)] cursor-pointer"
              >
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Atual: {p.stock} {p.unit} ({formatKz(p.salePrice)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card Resumo do Produto Selecionado */}
          {selectedProduct && (
            <div className="bg-[var(--surface-subtle)] p-3.5 rounded-[var(--radius-control)] border border-[var(--line)] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono">{selectedProduct.sku}</span>
                <p className="text-xs font-bold text-[var(--ink)] truncate max-w-xs">{selectedProduct.name}</p>
                <span className="text-[11px] text-[var(--text-secondary)]">Preço: {formatKz(selectedProduct.salePrice)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[var(--text-secondary)] block">Estoque Atual</span>
                <span className="font-mono font-bold text-sm text-[var(--ink)] numeric" data-numeric="true">
                  {selectedProduct.stock} {selectedProduct.unit}
                </span>
              </div>
            </div>
          )}

          {/* Quantidade a Adicionar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] mb-1.5 block">
                Quantidade a Adicionar (+) *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-white border border-[var(--line)] rounded-[var(--radius-control)] px-3 py-2 text-sm font-mono font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--line-strong)]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--ink)] mb-1.5 block">
                Número do Novo Lote
              </label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full bg-white border border-[var(--line)] rounded-[var(--radius-control)] px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--line-strong)]"
              />
            </div>
          </div>

          {/* Fornecedor & Motivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] mb-1.5 block">
                Fornecedor
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Ex: Distribuidora Central"
                className="w-full bg-white border border-[var(--line)] rounded-[var(--radius-control)] px-3 py-2 text-xs text-[var(--ink)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--line-strong)]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--ink)] mb-1.5 block">
                Motivo / Justificativa
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white border border-[var(--line)] rounded-[var(--radius-control)] px-3 py-2 text-xs font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--line-strong)] cursor-pointer"
              >
                <option value="Entrada de Mercadoria / Compra">Compra / Fornecedor</option>
                <option value="Devolução de Cliente">Devolução de Cliente</option>
                <option value="Ajuste de Inventário">Ajuste de Inventário</option>
                <option value="Transferência entre Filiais">Transferência</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between gap-3 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="btn--secondary"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn--primary"
            >
              <Check size={14} />
              <span>Confirmar Entrada no Estoque</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
