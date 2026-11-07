import React, { useState } from 'react';
import { 
  X, 
  Barcode, 
  Calendar, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Edit, 
  Trash2, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';
import { Product } from '../../types';
import { formatKz } from '../../utils/formatters';
import { Badge } from '../ui/Badge';

interface InventoryDetailDrawerProps {
  product: Product | null;
  isOpen: boolean;
  isManager: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
  onPrintLabel: (product: Product) => void;
  onStockAdjust: (product: Product, newStock: number, reason: string) => void;
}

export const InventoryDetailDrawer: React.FC<InventoryDetailDrawerProps> = ({
  product,
  isOpen,
  isManager,
  onClose,
  onEdit,
  onDelete,
  onPrintLabel,
  onStockAdjust,
}) => {
  const [copiedBarcode, setCopiedBarcode] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<string>('1');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustReason, setAdjustReason] = useState<string>('Entrada de Reposição / Fornecedor');

  if (!isOpen || !product) return null;

  // Helper: Days until expiration
  const getDaysToExpiry = (expiryDateStr?: string): number | null => {
    if (!expiryDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expiryDateStr);
    if (isNaN(expDate.getTime())) return null;
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysToExpiry = getDaysToExpiry(product.expirationDate);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStock;
  const isExpired = daysToExpiry !== null && daysToExpiry <= 0;
  const isExpiringSoon = daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry <= 30;

  // Financial calculations
  const cost = product.costPrice || 0;
  const sale = product.salePrice || 0;
  const unitProfit = sale - cost;
  const profitMarginPercent = sale > 0 ? ((unitProfit / sale) * 100).toFixed(1) : '0';
  const markupPercent = cost > 0 ? (((sale - cost) / cost) * 100).toFixed(1) : '0';
  const totalValuation = product.stock * sale;
  const totalCostValuation = product.stock * cost;

  const handleCopy = (text: string, type: 'barcode' | 'sku') => {
    navigator.clipboard.writeText(text);
    if (type === 'barcode') {
      setCopiedBarcode(true);
      setTimeout(() => setCopiedBarcode(false), 2000);
    } else {
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 2000);
    }
  };

  const handleApplyStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(adjustAmount) || 0;
    if (qty <= 0 && adjustType !== 'set') return;

    let newStock = product.stock;
    if (adjustType === 'add') newStock = product.stock + qty;
    else if (adjustType === 'subtract') newStock = Math.max(0, product.stock - qty);
    else if (adjustType === 'set') newStock = Math.max(0, qty);

    onStockAdjust(product, newStock, adjustReason);
    setAdjustAmount('1');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white border-l border-zinc-200 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
                <Boxes size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-zinc-900">Raio-X do Produto & Estoque</h2>
                <p className="text-xs text-zinc-500">Inspeção detalhada de lote, validade e precificação</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
            
            {/* 1. Hero Product Summary Card */}
            <div className="bg-zinc-50 rounded-3xl p-5 border border-zinc-200 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              {/* Product Photo */}
              <div className="w-28 h-28 shrink-0 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="max-h-24 w-auto object-contain drop-shadow-md"
                  />
                ) : (
                  <div className="font-black text-2xl text-zinc-400">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title & Identifiers */}
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {product.category || 'Geral'}
                  </span>

                  {isExpired ? (
                    <Badge variant="danger" label="Vencido" />
                  ) : isExpiringSoon ? (
                    <Badge variant="warning" label={`Vence em ${daysToExpiry}d`} />
                  ) : isOutOfStock ? (
                    <Badge variant="danger" label="Esgotado" />
                  ) : isLowStock ? (
                    <Badge variant="warning" label="Estoque Baixo" />
                  ) : (
                    <Badge variant="neutral" label="Normal" />
                  )}
                </div>

                <h1 className="text-lg font-bold text-[var(--ink)] leading-tight">
                  {product.name}
                </h1>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1 font-mono bg-white px-2.5 py-1 rounded-[var(--radius-control)] border border-[var(--line)]">
                    <span className="text-[var(--text-secondary)]">SKU:</span>
                    <span className="text-[var(--ink)] font-semibold">{product.sku}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(product.sku, 'sku')}
                      className="ml-1 text-[var(--text-secondary)] hover:text-[var(--ink)]"
                      title="Copiar SKU"
                    >
                      {copiedSku ? <Check size={12} className="text-[var(--success-text)]" /> : <Copy size={12} />}
                    </button>
                  </div>

                  {product.barcode && (
                    <div className="flex items-center gap-1 font-mono bg-white px-2.5 py-1 rounded-[var(--radius-control)] border border-[var(--line)]">
                      <Barcode size={14} className="text-[var(--text-secondary)]" />
                      <span className="text-[var(--ink)] font-semibold">{product.barcode}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(product.barcode, 'barcode')}
                        className="ml-1 text-[var(--text-secondary)] hover:text-[var(--ink)]"
                        title="Copiar Código de Barras"
                      >
                        {copiedBarcode ? <Check size={12} className="text-[var(--success-text)]" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Financial & Profitability Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <TrendingUp size={14} />
                <span>Indicadores Financeiros & Lucratividade</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Preço de Custo */}
                <div className="bg-[var(--surface-subtle)] p-3.5 rounded-[var(--radius-card)] border border-[var(--line)]">
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium block">Preço de Custo</span>
                  <p className="text-sm font-bold text-[var(--ink)] mt-1 numeric" data-numeric="true">{formatKz(cost)}</p>
                  <span className="text-[10px] text-[var(--text-secondary)]">unitário</span>
                </div>

                {/* Preço de Venda */}
                <div className="bg-[var(--surface-subtle)] p-3.5 rounded-[var(--radius-card)] border border-[var(--line)]">
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium block">Preço de Venda</span>
                  <p className="text-sm font-bold text-[var(--ink)] mt-1 numeric" data-numeric="true">{formatKz(sale)}</p>
                  <span className="text-[10px] text-[var(--text-secondary)]">unitário</span>
                </div>

                {/* Lucro Bruto Unitário */}
                <div className="bg-[var(--surface-subtle)] p-3.5 rounded-[var(--radius-card)] border border-[var(--line)]">
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium block">Lucro Unitário</span>
                  <p className="text-sm font-bold text-[var(--success-text)] mt-1 numeric" data-numeric="true">{formatKz(unitProfit)}</p>
                  <span className="text-[10px] text-[var(--success-text)] font-semibold font-mono numeric">+{profitMarginPercent}% margem</span>
                </div>

                {/* Valor Total em Estoque */}
                <div className="bg-[var(--surface-subtle)] p-3.5 rounded-[var(--radius-card)] border border-[var(--line)]">
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium block">Valoração Total</span>
                  <p className="text-sm font-bold text-[var(--ink)] mt-1 numeric" data-numeric="true">{formatKz(totalValuation)}</p>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono numeric">Custo: {formatKz(totalCostValuation)}</span>
                </div>
              </div>
            </div>

            {/* 3. Batch, Expiry & Supplier Metadata */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <ShieldCheck size={14} />
                <span>Rastreabilidade de Lote & Fornecedor</span>
              </h3>

              <div className="bg-[var(--surface-subtle)] rounded-[var(--radius-card)] p-4 border border-[var(--line)] divide-y divide-[var(--line)]">
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Calendar size={13} /> Data de Validade:
                  </span>
                  <span className={`font-mono font-bold ${
                    isExpired ? 'text-[var(--danger-text)]' : isExpiringSoon ? 'text-[var(--warning-text)]' : 'text-[var(--ink)]'
                  }`}>
                    {product.expirationDate || 'Sem validade cadastrada'}
                    {daysToExpiry !== null && (
                      <span className="text-[11px] ml-1.5 font-normal text-[var(--text-secondary)]">
                        ({daysToExpiry <= 0 ? 'Vencido' : `${daysToExpiry} dias restantes`})
                      </span>
                    )}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Boxes size={13} /> Número do Lote:
                  </span>
                  <span className="font-mono font-bold text-[var(--ink)] bg-white border border-[var(--line)] px-2 py-0.5 rounded-[var(--radius-control)]">
                    {product.batch || 'Lote Padrão'}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Building2 size={13} /> Fornecedor / Fabricante:
                  </span>
                  <span className="font-medium text-[var(--ink)]">
                    {product.supplier || 'Fornecedor padrão / Distribuidor'}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                    <MapPin size={13} /> Localização / Prateleira:
                  </span>
                  <span className="font-medium text-[var(--ink)]">
                    {product.notes || 'Estoque Central (A-01)'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Quick Stock Adjustment Form (Managers Only) */}
            {isManager && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                  <RefreshCw size={14} />
                  <span>Ajuste Rápido de Estoque</span>
                </h3>

                <form onSubmit={handleApplyStockAdjustment} className="bg-[var(--surface-subtle)] p-4 rounded-[var(--radius-card)] border border-[var(--line)] space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType('add')}
                      className={`filter-chip justify-center h-9 ${adjustType === 'add' ? 'active' : ''}`}
                    >
                      <Plus size={13} /> <span>Entrada (+Qtd)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustType('subtract')}
                      className={`filter-chip justify-center h-9 ${adjustType === 'subtract' ? 'active' : ''}`}
                    >
                      <Minus size={13} /> <span>Saída (-Qtd)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustType('set')}
                      className={`filter-chip justify-center h-9 ${adjustType === 'set' ? 'active' : ''}`}
                    >
                      <span>Ajustar Fixo</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 block">
                        {adjustType === 'set' ? 'Novo Estoque Total:' : 'Quantidade a Movimentar:'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        className="w-full bg-white border border-[var(--line)] rounded-[var(--radius-control)] px-3 py-2 text-sm font-mono font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--line-strong)]"
                        placeholder="Ex: 10"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 block">
                        Motivo / Justificativa:
                      </label>
                      <select
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        className="w-full bg-white border border-[var(--line)] rounded-[var(--radius-control)] px-3 py-2 text-xs font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--line-strong)] cursor-pointer"
                      >
                        <option value="Entrada de Reposição / Fornecedor">Entrada de Compra / Fornecedor</option>
                        <option value="Devolução de Cliente">Devolução de Cliente</option>
                        <option value="Ajuste de Inventário / Contagem Física">Ajuste de Inventário / Contagem</option>
                        <option value="Perda / Avaria / Quebra">Perda / Avaria / Quebra</option>
                        <option value="Doação ou Consumo Interno">Consumo Interno</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn--primary w-full"
                  >
                    <Check size={14} />
                    <span>Confirmar Movimentação de Estoque</span>
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onPrintLabel(product)}
              className="btn--secondary"
            >
              <Printer size={14} />
              <span>Imprimir Etiqueta</span>
            </button>

            {isManager && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDelete(product.id, product.name)}
                  className="btn--secondary p-2.5"
                  title="Excluir do Catálogo"
                >
                  <Trash2 size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="btn--primary"
                >
                  <Edit size={14} />
                  <span>Editar Produto</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
