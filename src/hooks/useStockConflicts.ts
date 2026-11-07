"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface ConflictProduct {
  name: string;
  stock: number;
  barcode?: string;
}

export interface ConflictItem {
  id: string;
  sale_id: string;
  product_id: string;
  requested_quantity: number;
  available_quantity: number;
  resolved?: boolean;
  created_at: string;
  products?: ConflictProduct | null;
}

export function useStockConflicts() {
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Carrega os conflitos existentes no carregamento inicial
  const fetchConflicts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("stock_conflicts")
        .select(`
          id,
          sale_id,
          product_id,
          requested_quantity,
          available_quantity,
          resolved,
          created_at,
          products ( name, stock, barcode )
        `)
        .eq("resolved", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar conflitos de stock:", error);
      } else if (data) {
        setConflicts(data as unknown as ConflictItem[]);
      }
    } catch (err) {
      console.error("Falha ao consultar stock_conflicts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar conflito como resolvido
  const resolveConflict = async (id: string) => {
    try {
      const { error } = await supabase
        .from("stock_conflicts")
        .update({ resolved: true })
        .eq("id", id);

      if (!error) {
        setConflicts((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Erro ao resolver conflito:", err);
    }
  };

  useEffect(() => {
    // 1. Carrega os conflitos existentes no carregamento inicial
    fetchConflicts();

    // 2. Cria o canal de subscrição em tempo real
    const channelName = `realtime_stock_conflicts_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stock_conflicts",
          filter: "resolved=eq.false",
        },
        async (payload) => {
          // O payload do evento traz apenas os dados da tabela `stock_conflicts`.
          // Fazemos o fetch do item com a relação de `products` para obter nome e barcode:
          const { data } = await supabase
            .from("stock_conflicts")
            .select(`
              id,
              sale_id,
              product_id,
              requested_quantity,
              available_quantity,
              created_at,
              products ( name, stock, barcode )
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            // Insere o novo conflito no topo da lista sem recarregar a página
            setConflicts((prev) => [data as unknown as ConflictItem, ...prev]);
          }
        }
      )
      .subscribe();

    // 3. Limpa a subscrição ao desmontar o componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConflicts]);

  return {
    conflicts,
    loading,
    refresh: fetchConflicts,
    resolveConflict,
  };
}
