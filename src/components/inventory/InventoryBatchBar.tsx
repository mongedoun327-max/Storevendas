import React from 'react';
import { Printer, Download, CheckSquare, X, Tag, Trash2 } from 'lucide-react';
import { Product } from '../../types';

interface InventoryBatchBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchPrintLabels: () => void;
  onBatchExport: () => void;
  onBatchDelete?: () => void;
}

export const InventoryBatchBar: React.FC<InventoryBatchBarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBatchPrintLabels,
  onBatchExport,
  onBatchDelete,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--ink)] border border-[var(--line-strong)] text-white rounded-[var(--radius-card)] px-5 py-2.5 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center gap-2 border-r border-white/20 pr-4">
        <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--ink)] font-bold text-xs flex items-center justify-center numeric" data-numeric="true">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold text-white">
          artigo{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBatchPrintLabels}
          className="px-3 py-1.5 rounded-[var(--radius-control)] bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
        >
          <Printer size={13} />
          <span>Imprimir Etiquetas</span>
        </button>

        <button
          type="button"
          onClick={onBatchExport}
          className="px-3 py-1.5 rounded-[var(--radius-control)] bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
        >
          <Download size={13} />
          <span>Exportar ({selectedCount})</span>
        </button>

        {onBatchDelete && (
          <button
            type="button"
            onClick={onBatchDelete}
            className="btn--danger h-8 text-xs px-3"
            title="Eliminar artigos selecionados"
          >
            <Trash2 size={13} />
            <span>Eliminar ({selectedCount})</span>
          </button>
        )}

        {selectedCount < totalCount && (
          <button
            type="button"
            onClick={onSelectAll}
            className="px-3 py-1.5 rounded-[var(--radius-control)] bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition cursor-pointer"
          >
            Selecionar Todos ({totalCount})
          </button>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 rounded-[var(--radius-control)] text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Desmarcar todos"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
