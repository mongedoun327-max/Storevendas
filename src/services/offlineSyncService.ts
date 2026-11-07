import { offlineDb, type OfflineSale } from "@/lib/db/offlineDb";
import { db, type LocalPendingSale } from "@/lib/db/posDatabase";
import { createClient } from "@/lib/supabase/client";

/** Guarda a venda no IndexedDB local. */
export async function saveSaleOffline(
  saleData: Omit<OfflineSale, "id" | "synced">
): Promise<number> {
  return offlineDb.sales.add({
    ...saleData,
    synced: 0,
  });
}

/** Sincroniza vendas pendentes com o Supabase. */
export async function syncPendingSales(): Promise<{ success: number; failed: number }> {
  if (typeof navigator === "undefined" || !navigator.onLine) {
    return { success: 0, failed: 0 };
  }

  const supabase = createClient();
  const pendingSales = await offlineDb.sales.where("synced").equals(0).toArray();

  if (pendingSales.length === 0) {
    return { success: 0, failed: 0 };
  }

  let successCount = 0;
  let failedCount = 0;

  for (const sale of pendingSales) {
    try {
      const { data: insertedSale, error: saleError } = await supabase
        .from("sales")
        .insert({
          total_amount: sale.totalAmount,
          payment_method: sale.paymentMethod,
          amount_paid: sale.amountPaid,
          change_amount: sale.change,
          created_at: sale.createdAt,
        })
        .select("id")
        .single();

      if (saleError) throw saleError;

      const saleItems = sale.items.map((item) => ({
        sale_id: insertedSale.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;

      if (sale.id !== undefined) {
        await offlineDb.sales.delete(sale.id);
      }
      successCount++;
    } catch (error) {
      console.error(`Erro ao sincronizar venda local #${sale.id}:`, error);
      failedCount++;
    }
  }

  return { success: successCount, failed: failedCount };
}

/** Sincroniza vendas pendentes validando e abatendo o stock via RPC atómica. */
export async function syncPendingSalesWithStockCheck(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.onLine) return;

  const supabase = createClient();
  const pendingSales = await offlineDb.sales.where("synced").equals(0).toArray();

  for (const sale of pendingSales) {
    try {
      const { data: insertedSale, error: saleError } = await supabase
        .from("sales")
        .insert({
          total_amount: sale.totalAmount,
          payment_method: sale.paymentMethod,
          amount_paid: sale.amountPaid,
          change_amount: sale.change,
          created_at: sale.createdAt,
        })
        .select("id")
        .single();

      if (saleError) throw saleError;

      for (const item of sale.items) {
        const { error: itemError } = await supabase.from("sale_items").insert({
          sale_id: insertedSale.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.subtotal,
        });

        if (itemError) throw itemError;

        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          "process_offline_sale_item",
          {
            p_product_id: item.productId,
            p_quantity: item.quantity,
            p_sale_id: insertedSale.id,
          }
        );

        if (rpcError) throw rpcError;

        if (rpcResult?.has_discrepancy) {
          console.warn(
            `Conflito detetado: Produto ${item.productId} ficou com stock negativo (${rpcResult.new_stock})`
          );
        }
      }

      if (sale.id !== undefined) {
        await offlineDb.sales.delete(sale.id);
      }
    } catch (error) {
      console.error(`Falha ao sincronizar venda #${sale.id}:`, error);
    }
  }
}

/** Regista uma venda localmente e inicia a sincronização em segundo plano. */
export async function registerLocalSale(
  saleData: Omit<LocalPendingSale, "synced">
): Promise<string> {
  const newSale: LocalPendingSale = {
    ...saleData,
    synced: 0,
  };

  await db.pendingSales.add(newSale);

  if (typeof navigator !== "undefined" && navigator.onLine) {
    void syncPendingSalesBatch();
  }

  return newSale.client_sale_id;
}

/** Sincroniza vendas locais em lote através da RPC do Supabase. */
export async function syncPendingSalesBatch(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.onLine) return;

  const pending = await db.pendingSales.where("synced").equals(0).toArray();
  if (pending.length === 0) return;

  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("sync_offline_sales", {
      p_sales: pending,
    });

    if (error) throw error;

    if (Array.isArray(data)) {
      const syncedIds = data
        .filter((result) => result.status === "synced" || result.status === "already_exists")
        .map((result) => result.client_sale_id)
        .filter((id): id is string => typeof id === "string");

      if (syncedIds.length > 0) {
        await db.pendingSales.bulkDelete(syncedIds);
      }
    }
  } catch (error) {
    console.error("Falha na sincronização em lote. Retentando na próxima conexão:", error);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void syncPendingSalesBatch();
  });
}
