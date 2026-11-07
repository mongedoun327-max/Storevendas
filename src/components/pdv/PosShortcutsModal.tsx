import React from 'react';
import { Keyboard, X, Sparkles, Check } from 'lucide-react';

interface PosShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PosShortcutsModal: React.FC<PosShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F2 / F3', action: 'Focar Leitor de Código de Barras / Pesquisa', category: 'Navegação' },
    { key: 'F9 / F2', action: 'Abrir Modal de Cobrança / Finalizar Venda', category: 'Pagamento' },
    { key: 'F4', action: 'Cancelar Atendimento Atual / Limpar Carrinho', category: 'Ações' },
    { key: 'F7', action: 'Sangria & Suprimento Rápido de Caixa', category: 'Caixa' },
    { key: 'F8', action: 'Vendas em Espera (Pausar / Retomar)', category: 'Atendimento' },
    { key: 'F10', action: 'Histórico de Vendas Recentes & Reimpressão', category: 'Histórico' },
    { key: 'ESC', action: 'Fechar Modais / Cancelar Janelas Abertas', category: 'Navegação' },
    { key: 'ENTER', action: 'Adicionar produto pesquisado / Confirmar Pagamento', category: 'Ações' },
    { key: 'Ctrl + Espaço', action: 'Cobrança Rápida do Total', category: 'Pagamento' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200/80 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
              <Keyboard size={18} />
            </div>
            <div>
              <h3 className="font-black text-sm text-zinc-950">Atalhos de Teclado do PDV</h3>
              <p className="text-[11px] text-zinc-400">Opere o caixa com agilidade máxima sem tirar as mãos do teclado</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100/80 transition-colors text-xs"
            >
              <div className="flex items-center gap-2.5">
                <kbd className="px-2.5 py-1 rounded-lg bg-zinc-950 text-white font-mono font-black text-xs shadow-xs min-w-[70px] text-center">
                  {sc.key}
                </kbd>
                <span className="font-semibold text-zinc-800">{sc.action}</span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-zinc-200/60 text-zinc-600 uppercase tracking-wider">
                {sc.category}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Entendido [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
