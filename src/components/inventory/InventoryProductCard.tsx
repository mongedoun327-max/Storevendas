import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Edit, 
  Trash2, 
  Printer, 
  Eye, 
  Plus, 
  Minus, 
  Tag, 
  Building2, 
  MapPin, 
  Check, 
  Copy,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Product } from '../../types';
import { formatKz } from '../../utils/formatters';
import { Badge } from '../ui/Badge';

interface InventoryProductCardProps {
  product: Product;
  index?: number;
  isManager: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
  onPrintLabel: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onQuickStockAdjust: (product: Product, delta: number) => void;
}

export const InventoryProductCard: React.FC<InventoryProductCardProps> = ({
  product,
  index = 0,
  isManager,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onPrintLabel,
  onViewDetails,
  onQuickStockAdjust,
}) => {
  const [copiedSku, setCopiedSku] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  // Stock percentage calculation relative to 2x minStock for gauge
  const maxBar = Math.max(product.minStock * 2.5, product.stock, 10);
  const stockPercentage = Math.min(100, Math.max(5, (product.stock / maxBar) * 100));

  // Profit margin calculation
  const cost = product.costPrice || 0;
  const sale = product.salePrice || 0;
  const profit = sale - cost;
  const marginPercent = sale > 0 ? Math.round((profit / sale) * 100) : 0;

  const handleCopySku = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.barcode || product.sku) {
      navigator.clipboard.writeText(product.barcode || product.sku);
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 1800);
    }
  };

  return (
    <motion.div
      id={`product-card-${product.id}`}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.25, 0.1, 0.25, 1.0]
      }}
      className={`group relative flex flex-col justify-between bg-[var(--surface)] border rounded-[var(--radius-card)] p-4 transition-all duration-200 shadow-xs hover:shadow-md ${
        isSelected 
          ? 'ring-2 ring-[var(--ink)] border-[var(--ink)] bg-[var(--surface-subtle)]' 
          : isOutOfStock
          ? 'border-[var(--danger)]/40 hover:border-[var(--danger)]'
          : isLowStock
          ? 'border-[var(--warning)]/40 hover:border-[var(--warning)]'
          : 'border-[var(--line)] hover:border-[var(--line-strong)]'
      }`}
    >
      {/* Top Header Row: Checkbox, Category Chip & Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isManager && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(product.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded-[var(--radius-control)] bg-[var(--surface-subtle)] border-[var(--line)] text-[var(--ink)] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[var(--ink)]"
              title="Selecionar produto"
            />
          )}
          <span className="px-2 py-0.5 rounded-[var(--radius-control)] text-[10px] font-semibold uppercase tracking-wider bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--line)] truncate max-w-[130px]">
            {product.category || 'Geral'}
          </span>
        </div>

        {/* Canonical Semantic Status Badge */}
        {isExpired ? (
          <Badge variant="danger" label="Vencido" />
        ) : isExpiringSoon ? (
          <Badge variant="warning" label={`Vence em ${daysToExpiry}d`} />
        ) : isOutOfStock ? (
          <Badge variant="danger" label="Esgotado" />
        ) : isLowStock ? (
          <Badge variant="warning" label="Est. Baixo" />
        ) : (
          <Badge variant="neutral" label="Normal" />
        )}
      </div>

      {/* Product Image & Quick Preview Container */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative w-full h-36 mb-3 rounded-[var(--radius-card)] bg-[var(--surface-subtle)] border border-[var(--line)] flex items-center justify-center p-2 group-hover:bg-zinc-100/70 transition-colors cursor-pointer overflow-hidden"
      >
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="max-h-32 w-auto object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-105 pointer-events-none"
          />
        ) : (
          <div className="w-16 h-16 rounded-[var(--radius-control)] bg-white border border-[var(--line)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-xl shadow-inner">
            {product.name ? product.name.charAt(0).toUpperCase() : 'P'}
          </div>
        )}

        {/* Overlay Action Prompt on Hover */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
          <span className="btn--primary text-xs h-8 px-3 shadow-md">
            <Eye size={13} />
            <span>Ver Detalhes</span>
          </span>
        </div>
      </div>

      {/* Product Title, SKU, Barcode */}
      <div className="space-y-1 mb-3">
        <h3 
          onClick={() => onViewDetails(product)}
          className="font-bold text-sm text-[var(--ink)] hover:underline transition-colors line-clamp-2 leading-tight cursor-pointer"
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <button
            type="button"
            onClick={handleCopySku}
            className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-[var(--surface-subtle)]"
            title="Copiar Código"
          >
            <span>{product.sku || product.barcode}</span>
            {copiedSku ? <Check size={11} className="text-[var(--success-text)]" /> : <Copy size={11} className="opacity-60" />}
          </button>

          {product.batch && (
            <>
              <span className="opacity-40">•</span>
              <span className="font-mono text-[10px] text-[var(--ink)] bg-[var(--surface-subtle)] border border-[var(--line)] px-1.5 py-0.5 rounded-[var(--radius-control)]">
                Lote: {product.batch}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stock Health Progress Bar */}
      <div className="bg-[var(--surface-subtle)] rounded-[var(--radius-control)] p-2.5 border border-[var(--line)] mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)] text-[11px] font-medium">Estoque Atual:</span>
          <span className={`font-bold font-mono text-xs ${
            isOutOfStock ? 'text-[var(--danger-text)]' : isLowStock ? 'text-[var(--warning-text)]' : 'text-[var(--ink)]'
          }`}>
            {product.stock} <span className="text-[10px] text-[var(--text-secondary)] font-normal">{product.unit || 'un'}</span>
          </span>
        </div>

        {/* Visual Progress Gauge (Deterministic Masakula v2.0) */}
        <div className="progress-track h-1.5">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              isOutOfStock 
                ? 'bg-[var(--danger)] w-full' 
                : isLowStock 
                ? 'bg-[var(--warning)]' 
                : 'bg-[var(--ink)]'
            }`}
            style={{ width: `${stockPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-mono">
          <span>Mín: {product.minStock} {product.unit || 'un'}</span>
          {product.supplier && <span className="truncate max-w-[120px]">{product.supplier}</span>}
        </div>
      </div>

      {/* Price & Financial Margin Display */}
      <div className="flex items-end justify-between gap-2 pt-2 border-t border-[var(--line)] mb-3">
        <div>
          <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider block">Preço de Venda</span>
          <div className="font-bold text-base text-[var(--ink)] numeric" data-numeric="true">
            {formatKz(product.salePrice)}
          </div>
        </div>

        {isManager && marginPercent > 0 && (
          <div className="text-right">
            <span className="text-[11px] font-semibold text-[var(--success-text)] font-mono numeric" data-numeric="true">
              +{marginPercent}% margem
            </span>
          </div>
        )}
      </div>

      {/* Footer Controls: Fast Quick Adjustment Stepper & Action Icons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Quick Stock Replenish Stepper (-1 / +1) */}
        {isManager ? (
          <div className="flex items-center bg-[var(--surface-subtle)] border border-[var(--line)] rounded-[var(--radius-control)] p-0.5">
            <button
              type="button"
              onClick={() => onQuickStockAdjust(product, -1)}
              disabled={product.stock <= 0}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--ink)] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Diminuir 1 un do estoque"
            >
              <Minus size={12} />
            </button>
            <span className="px-2 text-xs font-mono font-bold text-[var(--ink)] numeric">
              {product.stock}
            </span>
            <button
              type="button"
              onClick={() => onQuickStockAdjust(product, 1)}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--ink)] hover:bg-white transition-colors cursor-pointer"
              title="Adicionar 1 un ao estoque"
            >
              <Plus size={12} />
            </button>
          </div>
        ) : (
          <div className="text-xs font-mono text-[var(--text-secondary)]">
            Disp: <strong className="text-[var(--ink)]">{product.stock} {product.unit}</strong>
          </div>
        )}

        {/* Action Icon Buttons (Clean Secondary Styling) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPrintLabel(product)}
            className="p-1.5 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--ink)] border border-[var(--line)] transition-colors cursor-pointer"
            title="Imprimir Etiquetas & Código de Barras"
          >
            <Printer size={13} />
          </button>

          {isManager && (
            <>
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="p-1.5 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--ink)] border border-[var(--line)] transition-colors cursor-pointer"
                title="Editar Produto & Preço"
              >
                <Edit size={13} />
              </button>

              <button
                type="button"
                onClick={() => onDelete(product.id, product.name)}
                className="p-1.5 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--danger-soft)] text-[var(--text-secondary)] hover:text-[var(--danger-text)] border border-[var(--line)] hover:border-[var(--danger-soft)] transition-colors cursor-pointer"
                title="Excluir Produto"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
