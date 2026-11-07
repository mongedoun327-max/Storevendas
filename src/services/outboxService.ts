// services/outboxService.ts
import { db, Sale } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Sincroniza a fila Outbox de vendas pendentes em lote (batch) com o Supabase via RPC.
 */
export async function syncOutboxQueue() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  // Seleciona até 50 vendas pendentes para evitar payloads gigantescos
  const pendingEntries = await db.outbox
    .where("status")
    .equals("pending")
    .limit(50)
    .toArray();

  if (pendingEntries.length === 0) return;

  const entryIds = pendingEntries.map((e) => e.id!);

  // Marca os itens como 'processing' para evitar concorrência no cliente
  await db.outbox.where("id").anyOf(entryIds).modify({ status: "processing" });

  const payload = pendingEntries.map((e) => e.payload);

  try {
    // Chamada à RPC do Supabase enviando o lote JSON
    const { data, error } = await supabase.rpc("process_offline_sales_batch", {
      sales_payload: payload,
    });

    if (error) throw error;

    if (data) {
      const salesWithConflicts = (data as any[]).filter((item: any) => item.had_conflict);

      if (salesWithConflicts.length > 0) {
        console.warn(
          `Sincronização concluída: ${salesWithConflicts.length} vendas geraram alertas de stock negativo.`
        );

        // Notificar operador do POS via toast e evento no cliente
        if (typeof window !== "undefined") {
          toast.warning(
            `Atenção: ${salesWithConflicts.length} venda(s) sincronizada(s) com alerta de ruptura/stock negativo.`,
            {
              duration: 6000,
            }
          );

          window.dispatchEvent(
            new CustomEvent("stock-conflicts-detected", {
              detail: { conflicts: salesWithConflicts, count: salesWithConflicts.length },
            })
          );
        }
      }
    }

    // Remove os itens processados com sucesso da fila Outbox e marca a venda como sincronizada
    const syncedSaleIds = pendingEntries.map((e) => e.sale_id);

    await db.transaction("rw", [db.sales, db.outbox], async () => {
      await db.outbox.where("id").anyOf(entryIds).delete();
      await db.sales.where("id").anyOf(syncedSaleIds).modify({ synced: true });
    });
  } catch (err: unknown) {
    console.error("Falha ao sincronizar lote Outbox:", err);

    const errorMessage = err instanceof Error ? err.message : String(err);

    // Incrementa contagem de erros e reverte estado para 'pending' ou 'failed'
    await db.transaction("rw", db.outbox, async () => {
      for (const entry of pendingEntries) {
        if (!entry.id) continue;
        if (entry.retry_count >= 5) {
          await db.outbox.update(entry.id, {
            status: "failed",
            error: errorMessage || "Excedeu limite de tentativas",
          });
        } else {
          await db.outbox.update(entry.id, {
            status: "pending",
            retry_count: (entry.retry_count || 0) + 1,
          });
        }
      }
    });
  }
}

/**
 * Regista uma venda de forma transacional e ACID localmente, adicionando à fila Outbox.
 */
export async function checkoutSale(saleData: Omit<Sale, "synced">) {
  const sale: Sale = { ...saleData, synced: false };

  // Transação ACID no IndexedDB
  await db.transaction("rw", [db.sales, db.outbox], async () => {
    // 1. Grava a venda localmente no POS
    await db.sales.add(sale);

    // 2. Grava o evento de envio na fila Outbox
    await db.outbox.add({
      sale_id: sale.id,
      payload: sale,
      status: "pending",
      retry_count: 0,
      created_at: new Date().toISOString(),
    });
  });

  // Tenta processar imediatamente a fila se estiver online
  if (typeof navigator !== "undefined" && navigator.onLine) {
    syncOutboxQueue();
  }
}

// Ouvinte global para ligar o disparo automático quando a internet voltar
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncOutboxQueue();
  });
}
