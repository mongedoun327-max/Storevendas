"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  RotateCcw, 
  X, 
  Package, 
  Layers, 
  Users, 
  TrendingDown, 
  UserCheck, 
  Sparkles,
  ArchiveRestore,
  Trash
} from 'lucide-react';
import { useTrash } from '@/contexts/TrashContext';

export const FloatingTrashCan: React.FC = () => {
  const { 
    deletedItems, 
    isTrashOpen, 
    setIsTrashOpen, 
    isAbsorbing, 
    flyingParticles, 
    restore, 
    removePermanent, 
    clearTrash 
  } = useTrash();

  const [isHovered, setIsHovered] = useState(false);
  const [isTemporarilyVisible, setIsTemporarilyVisible] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Monitora o ciclo de vida da exclusão:
  // 1. Ao apagar, partículas entram em voo ou a absorção é ativada -> Lixeira surge instantaneamente
  // 2. Quando a partícula é absorvida e o efeito termina -> Fica visível por ~1.8s e depois DESAPARECE
  useEffect(() => {
    if (flyingParticles.length > 0 || isAbsorbing) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setIsTemporarilyVisible(true);
    } else if (isTemporarilyVisible && !isTrashOpen && !isHovered) {
      // Quando termina a absorção do artigo, aguarda 1.8s para mostrar a tampa fechada
      // e depois desvanece completamente, esperando a próxima vez que for acionado
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        setIsTemporarilyVisible(false);
        hideTimerRef.current = null;
      }, 1800);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [flyingParticles.length, isAbsorbing, isTemporarilyVisible, isTrashOpen, isHovered]);

  const handleCloseTrash = () => {
    setIsTrashOpen(false);
    setIsTemporarilyVisible(false);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // O ícone SÓ APARECE durante a ação de apagar (e o breve momento de absorção),
  // ou se o utilizador abriu explicitamente a lixeira para restaurar
  const isVisible = isTrashOpen || isTemporarilyVisible || flyingParticles.length > 0 || isAbsorbing;

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
      case 'user':
        return <UserCheck className="w-4 h-4 text-purple-400" />;
      default:
        return <Trash2 className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <>
      {/* Backdrop sutil quando o painel de ver a lixeira estiver aberto */}
      {isTrashOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" 
          onClick={handleCloseTrash} 
        />
      )}

      {/* 1. OVERLAY DE ELEMENTOS EM VOO: O elemento viaja pelo ar e entra fisicamente dentro do ícone da lixeira */}
      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        {flyingParticles.map((particle) => {
          // Destino: boca superior da lixeira flutuante no canto inferior direito
          const targetX = typeof window !== 'undefined' ? window.innerWidth - 52 : 1000;
          const targetY = typeof window !== 'undefined' ? window.innerHeight - 66 : 700;

          return (
            <motion.div
              key={particle.id}
              initial={{
                x: particle.startX,
                y: particle.startY,
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: [
                  particle.startX, 
                  particle.startX + (targetX - particle.startX) * 0.45, 
                  targetX
                ],
                y: [
                  particle.startY, 
                  Math.min(particle.startY, targetY) - 100, 
                  targetY
                ],
                scale: [1, 0.85, 0.12],
                opacity: [1, 0.95, 0],
                rotate: [0, -16, 42],
              }}
              transition={{
                duration: 0.78,
                ease: [0.25, 0.9, 0.4, 1],
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-zinc-950 px-4 py-2.5 text-white shadow-2xl border border-rose-400/50 flex items-center gap-2.5 backdrop-blur-md"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#E1FB15]">
                <Trash2 className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-200">
                  A entrar na Lixeira...
                </span>
                <span className="text-xs font-bold truncate max-w-[150px] text-white">
                  {particle.name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 2. ÍCONE FLUTUANTE DA LIXEIRA: SÓ APARECE QUANDO SE APAGA UM ELEMENTO */}
      <AnimatePresence>
        {isVisible && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Popover / Painel da Lixeira com Lista de Itens */}
            <AnimatePresence>
              {isTrashOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 20, transformOrigin: 'bottom right' }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="mb-3 w-80 sm:w-96 rounded-3xl bg-zinc-950/95 border border-white/10 p-5 text-white shadow-2xl backdrop-blur-xl space-y-4"
                >
                  {/* Header da Lixeira */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                          <span>Lixeira do Sistema</span>
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                            {deletedItems.length}
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          {deletedItems.length === 1 ? '1 item disponível' : `${deletedItems.length} itens disponíveis`} para restauro
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCloseTrash}
                      className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="Fechar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lista de Itens Apagados */}
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {deletedItems.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 text-xs">
                        Lixeira vazia
                      </div>
                    ) : (
                      deletedItems.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -15 }}
                          className="group flex items-center justify-between gap-3 rounded-2xl bg-zinc-900/80 border border-white/5 p-3 hover:border-white/15 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/5">
                              {getItemIcon(item.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate group-hover:text-[#E1FB15] transition">
                                {item.name}
                              </p>
                              <span className="text-[10px] text-zinc-400 font-medium">
                                {item.typeLabel}
                              </span>
                            </div>
                          </div>

                          {/* Botões de Ação por Item */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => restore(item.id)}
                              className="flex items-center gap-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                              title="Restaurar item para a página original"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restaurar</span>
                            </button>
                            <button
                              onClick={() => removePermanent(item.id)}
                              className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Eliminar definitivamente"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Ações Globais da Lixeira */}
                  {deletedItems.length > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2">
                      <button
                        onClick={clearTrash}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Esvaziar Lixeira</span>
                      </button>

                      <button
                        onClick={async () => {
                          const items = [...deletedItems];
                          for (const it of items) {
                            await restore(it.id);
                          }
                        }}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5 cursor-pointer px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        <span>Restaurar Todos</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* BOTÃO FLUTUANTE DA LIXEIRA (COM TAMPA ARTICULADA E ANIMAÇÃO DE SUCÇÃO) */}
            <motion.button
              layout
              initial={{ scale: 0, rotate: -25, opacity: 0 }}
              animate={{ 
                scale: isAbsorbing ? 1.25 : 1, 
                rotate: isAbsorbing ? [-8, 8, -4, 0] : 0, 
                opacity: 1 
              }}
              exit={{ scale: 0, rotate: 25, opacity: 0 }}
              transition={{
                scale: { type: 'spring', damping: 18, stiffness: 300 },
                rotate: isAbsorbing 
                  ? { duration: 0.45, ease: 'easeInOut' } 
                  : { duration: 0.2 },
                opacity: { duration: 0.2 },
                layout: { type: 'spring', damping: 20, stiffness: 300 },
              }}
              onClick={() => {
                if (isTrashOpen) {
                  handleCloseTrash();
                } else {
                  setIsTrashOpen(true);
                }
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl transition-colors duration-200 cursor-pointer ${
                isAbsorbing
                  ? 'bg-rose-600 text-white ring-8 ring-rose-500/40 shadow-rose-600/60'
                  : 'bg-zinc-900/95 hover:bg-zinc-800 text-rose-400 border-2 border-rose-500/30 shadow-black/80'
              }`}
              title="Lixeira flutuante (clique para ver itens e restaurar)"
            >
              {/* ÍCONE SVG DA LIXEIRA COM TAMPA QUE LEVANTA E ABRE PARA RECEBER O ELEMENTO */}
              <div className="relative flex items-center justify-center w-8 h-8">
                <svg viewBox="0 0 48 48" className="w-8 h-8 overflow-visible" fill="none">
                  {/* Tampa articulada da lixeira */}
                  <motion.g
                    animate={
                      isAbsorbing
                        ? { y: -7, rotate: -28, transformOrigin: '36px 14px' }
                        : { y: 0, rotate: 0 }
                    }
                    transition={{ type: 'spring', damping: 14, stiffness: 280 }}
                  >
                    {/* Alça/Puxador da tampa */}
                    <rect x="20" y="8" width="8" height="3" rx="1.5" fill="currentColor" opacity="0.9" />
                    {/* Aba superior da tampa */}
                    <rect x="10" y="11" width="28" height="4" rx="2" fill="currentColor" />
                  </motion.g>

                  {/* Abertura/Boca interna escura quando a tampa levanta */}
                  <ellipse cx="24" cy="15" rx="11" ry="3" fill="#09090b" opacity={isAbsorbing ? 1 : 0.4} />

                  {/* Cesto / Corpo da lixeira */}
                  <path
                    d="M13 15 L16 38 C16.2 39.5 17.5 40.5 19 40.5 L29 40.5 C30.5 40.5 31.8 39.5 32 38 L35 15 Z"
                    fill="currentColor"
                    opacity="0.2"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {/* Ranhuras verticais */}
                  <line x1="20" y1="20" x2="21" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <line x1="24" y1="20" x2="24" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <line x1="28" y1="20" x2="27" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                </svg>

                {/* Vórtice / Ondas de sucção magnética no momento da absorção */}
                {isAbsorbing && (
                  <>
                    <motion.div
                      initial={{ scale: 0.3, opacity: 0.9 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 0.55, ease: 'easeOut' }}
                      className="absolute inset-0 -m-3 rounded-full border-2 border-rose-400/60 bg-rose-500/20 pointer-events-none"
                    />
                    <motion.div
                      initial={{ y: 0, opacity: 1, scale: 0.5 }}
                      animate={{ y: -22, opacity: 0, scale: 1.2 }}
                      transition={{ duration: 0.45 }}
                      className="absolute -top-4 text-amber-300 pointer-events-none"
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  </>
                )}
              </div>

              {/* Badge com Contador de Itens na Lixeira */}
              <motion.span
                key={deletedItems.length}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-black text-white shadow-lg shadow-rose-500/50 border-2 border-zinc-950"
              >
                {deletedItems.length}
              </motion.span>

              {/* Tooltip ao passar o cursor quando fechada */}
              {isHovered && !isTrashOpen && (
                <div className="absolute right-full mr-3 whitespace-nowrap rounded-xl bg-zinc-900 border border-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-xl">
                  {deletedItems.length} {deletedItems.length === 1 ? 'item na lixeira' : 'itens na lixeira'} • Clique para abrir
                </div>
              )}
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
