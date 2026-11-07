"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CashMovement } from "@/types/shift";

export function useRealtimeMovements(shiftId: string, initialMovements: CashMovement[] = []) {
  const [movements, setMovements] = useState<CashMovement[]>(initialMovements);

  useEffect(() => {
    setMovements(initialMovements);

    if (!shiftId) return;

    // Escuta inserções em tempo real na tabela 'cash_movements' para este turno
    const channel = supabase
      .channel(`realtime-movements-${shiftId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "cash_movements",
          filter: `shift_id=eq.${shiftId}`,
        },
        async (payload) => {
          const newRow = payload.new as any;
          if (!newRow) return;

          // Busca dados do operador para enriquecer o objeto
          let operatorName = "Sistema / Supervisor";
          if (newRow.operator_id) {
            const { data: opData } = await supabase
              .from("operators")
              .select("name")
              .eq("id", newRow.operator_id)
              .single();

            if (opData?.name) {
              operatorName = opData.name;
            }
          }

          const formattedMovement: CashMovement = {
            id: newRow.id,
            type: newRow.type,
            amount: Number(newRow.amount),
            reason: newRow.reason,
            timestamp: newRow.created_at || new Date().toISOString(),
            operatorName,
          };

          setMovements((prev) => [formattedMovement, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shiftId]);

  return movements;
}

export default useRealtimeMovements;
