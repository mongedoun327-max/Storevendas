"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { soundEffects } from '@/lib/audio/soundEffects';

export interface DeletedItemRecord {
  id: string;
  name: string;
  type: 'product' | 'category' | 'customer' | 'expense' | 'user' | string;
  typeLabel: string;
  data: any;
  deletedAt: number;
  onRestore: (data: any) => Promise<void> | void;
  onPermanentDelete?: (data: any) => Promise<void> | void;
}

export interface FlyingParticle {
  id: string;
  name: string;
  typeLabel: string;
  startX: number;
  startY: number;
}

interface TrashContextType {
  deletedItems: DeletedItemRecord[];
  activeUndo: DeletedItemRecord | null;
  isTrashOpen: boolean;
  isAbsorbing: boolean;
  flyingParticles: FlyingParticle[];
  setIsTrashOpen: (open: boolean) => void;
  trash: (
    item: Omit<DeletedItemRecord, 'deletedAt'>,
    clickPos?: { clientX: number; clientY: number } | React.MouseEvent
  ) => void;
  restore: (id: string) => Promise<void>;
  restoreLast: () => Promise<void>;
  dismissUndo: () => void;
  clearTrash: () => void;
  removePermanent: (id: string) => void;
}

const TrashContext = createContext<TrashContextType | undefined>(undefined);

const UNDO_TIMEOUT_MS = 8000; // 8 segundos para desfazer inline na página

export const TrashProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deletedItems, setDeletedItems] = useState<DeletedItemRecord[]>([]);
  const [activeUndo, setActiveUndo] = useState<DeletedItemRecord | null>(null);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isAbsorbing, setIsAbsorbing] = useState(false);
  const [flyingParticles, setFlyingParticles] = useState<FlyingParticle[]>([]);

  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const dismissUndo = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setActiveUndo(null);
  }, []);

  const trash = useCallback(
    (
      item: Omit<DeletedItemRecord, 'deletedAt'>,
      clickPos?: { clientX: number; clientY: number } | React.MouseEvent
    ) => {
      const record: DeletedItemRecord = {
        ...item,
        deletedAt: Date.now(),
      };

      // Adiciona à lista da lixeira
      setDeletedItems((prev) => [record, ...prev]);

      // Ativa o Undo na página
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      setActiveUndo(record);
      undoTimerRef.current = setTimeout(() => {
        setActiveUndo(null);
        undoTimerRef.current = null;
      }, UNDO_TIMEOUT_MS);

      // Coordenadas de partida da partícula de voo
      let startX = window.innerWidth / 2;
      let startY = window.innerHeight / 2;

      if (clickPos && 'clientX' in clickPos && typeof clickPos.clientX === 'number') {
        startX = clickPos.clientX;
        startY = clickPos.clientY;
      } else {
        startX += (Math.random() - 0.5) * 60;
        startY += (Math.random() - 0.5) * 40;
      }

      const particleId = `particle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newParticle: FlyingParticle = {
        id: particleId,
        name: record.name,
        typeLabel: record.typeLabel,
        startX,
        startY,
      };

      setFlyingParticles((prev) => [...prev, newParticle]);

      // Toca som suave de voo/vento
      soundEffects.playTrashWhoosh();

      // Quando a partícula chega perto da lixeira (~450ms), ativa animação de absorção da lixeira e som de impacto
      setTimeout(() => {
        setIsAbsorbing(true);
        soundEffects.playTrashAbsorb();
        setTimeout(() => setIsAbsorbing(false), 550);
      }, 450);

      // Remove a partícula do DOM após completar a animação de voo (800ms)
      setTimeout(() => {
        setFlyingParticles((prev) => prev.filter((p) => p.id !== particleId));
      }, 800);
    },
    []
  );

  const restore = useCallback(
    async (id: string) => {
      const itemToRestore = deletedItems.find((item) => item.id === id);
      if (!itemToRestore) return;

      try {
        await itemToRestore.onRestore(itemToRestore.data);
        setDeletedItems((prev) => prev.filter((item) => item.id !== id));

        if (activeUndo?.id === id) {
          dismissUndo();
        }

        soundEffects.playSuccess();
        toast.success(`${itemToRestore.typeLabel} "${itemToRestore.name}" restaurado com sucesso.`);
      } catch (error) {
        console.error('Erro ao restaurar item:', error);
        toast.error(`Falha ao restaurar "${itemToRestore.name}".`);
      }
    },
    [deletedItems, activeUndo, dismissUndo]
  );

  const restoreLast = useCallback(async () => {
    if (activeUndo) {
      await restore(activeUndo.id);
    } else if (deletedItems.length > 0) {
      await restore(deletedItems[0].id);
    }
  }, [activeUndo, deletedItems, restore]);

  const removePermanent = useCallback((id: string) => {
    setDeletedItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.onPermanentDelete) {
        try {
          item.onPermanentDelete(item.data);
        } catch (e) {
          console.warn('Erro ao executar remoção definitiva:', e);
        }
      }
      return prev.filter((i) => i.id !== id);
    });

    if (activeUndo?.id === id) {
      dismissUndo();
    }
    toast.info('Item removido definitivamente da lixeira.');
  }, [activeUndo, dismissUndo]);

  const clearTrash = useCallback(() => {
    deletedItems.forEach((item) => {
      if (item.onPermanentDelete) {
        try {
          item.onPermanentDelete(item.data);
        } catch (e) {
          console.warn(e);
        }
      }
    });
    setDeletedItems([]);
    dismissUndo();
    setIsTrashOpen(false);
    toast.info('Lixeira esvaziada.');
  }, [deletedItems, dismissUndo]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  return (
    <TrashContext.Provider
      value={{
        deletedItems,
        activeUndo,
        isTrashOpen,
        isAbsorbing,
        flyingParticles,
        setIsTrashOpen,
        trash,
        restore,
        restoreLast,
        dismissUndo,
        clearTrash,
        removePermanent,
      }}
    >
      {children}
    </TrashContext.Provider>
  );
};

export function useTrash() {
  const context = useContext(TrashContext);
  if (!context) {
    throw new Error('useTrash deve ser usado dentro de um TrashProvider');
  }
  return context;
}
