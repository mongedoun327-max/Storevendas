"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCcw, 
  X, 
  Package, 
  Layers, 
  Users, 
  TrendingDown, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { useTrash } from '@/contexts/TrashContext';

interface InlinePageUndoBannerProps {
  pageType?: 'product' | 'category' | 'customer' | 'expense' | 'user' | string;
  className?: string;
}

export const InlinePageUndoBanner: React.FC<InlinePageUndoBannerProps> = ({
  pageType,
  className = '',
}) => {
  const { activeUndo, restore, dismissUndo, setIsTrashOpen } = useTrash();
  const [progress, setProgress] = useState(100);
  const [secondsRemaining, setSecondsRemaining] = useState(8);

  const shouldShow = Boolean(
    activeUndo && (!pageType || activeUndo.type === pageType)
  );

  useEffect(() => {
    if (!shouldShow || !activeUndo) {
      setProgress(100);
      setSecondsRemaining(8);
      return;
    }

    const duration = 8000;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      const secs = Math.max(0, Math.ceil((duration - elapsed) / 1000));
      setProgress(remainingPercent);
      setSecondsRemaining(secs);

      if (remainingPercent <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [shouldShow, activeUndo]);

  if (!shouldShow || !activeUndo) return null;

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4 text-[#E1FB15]" />;
      case 'category':
        return <Layers className="w-4 h-4 text-blue-400" />;
      case 'customer':
        return <Users className="w-4 h-4 text-amber-400" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4 text-rose-400" />;
      default:
        return <Trash2 className="w-4 h-4 text-zinc-300" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-20 overflow-hidden rounded-2xl bg-zinc-950/95 border border-[#E1FB15]/40 text-white shadow-xl backdrop-blur-xl p-3.5 mb-5 ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Informação contextual do item apagado */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-white/10 shadow-inner">
              {getItemIcon(activeUndo.type)}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            </div>

            <div className="text-xs min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                  {activeUndo.typeLabel || 'Item'} Apagado
                </span>
                <span className="text-zinc-400 text-[11px]">
                  Enviado para a lixeira
                </span>
              </div>
              <p className="font-bold text-white truncate max-w-[240px] sm:max-w-md text-sm mt-0.5">
                "{activeUndo.name}"
              </p>
            </div>
          </div>

          {/* Ações de Desfazer, Ver Lixeira e Fechar */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => restore(activeUndo.id)}
              className="group flex items-center gap-2 rounded-xl bg-[#E1FB15] hover:bg-[#d4ee13] active:scale-95 text-black px-4 py-2 text-xs font-black tracking-wide shadow-lg shadow-[#E1FB15]/20 transition-all cursor-pointer"
              title="Restaurar item imediatamente nesta página"
            >
              <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-45" />
              <span>Desfazer</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/15 font-mono font-extrabold">
                {secondsRemaining}s
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsTrashOpen(true)}
              className="hidden sm:flex items-center gap-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-2 text-xs text-zinc-300 hover:text-white transition cursor-pointer"
              title="Abrir lixeira flutuante"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px] font-medium">Ver Lixeira</span>
            </button>

            <button
              type="button"
              onClick={dismissUndo}
              className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Fechar aviso de desfazer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Progresso Regressiva com Gradiente Fluido */}
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-zinc-800/80">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 via-[#E1FB15] to-emerald-400"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
