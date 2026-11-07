// services/trashService.ts
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export type EntityTable = "products" | "categories" | "sales" | string; // Extensível a "categories", "sales", etc.

/**
// 1. Soft Delete Local: Oculta o item instantaneamente no Dexie.js
 */
export async function softDeleteLocal(table: EntityTable, id: string) {
  try {
    await db.table(table).update(id, {
      deleted_at: new Date().toISOString(),
      _synced: false,
    });
  } catch (err) {
    console.warn(`[trashService] Aviso ao executar softDeleteLocal em ${table}/${id}:`, err);
  }
}

/**
// 2. Restauração (Undo): Reverte a eliminação local
 */
export async function restoreLocal(table: EntityTable, id: string) {
  try {
    await db.table(table).update(id, {
      deleted_at: null,
      _synced: false,
    });
  } catch (err) {
    console.warn(`[trashService] Aviso ao executar restoreLocal em ${table}/${id}:`, err);
  }
}

/**
// 3. Commit Definitivo: Dispara após o timer de 5s expirar
 */
export async function commitPermanentDelete(table: EntityTable, id: string) {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      // Se online, apaga no Supabase via RPC ou DELETE direto
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (!error) {
        // Removido com sucesso no servidor, limpa da base local
        try {
          await db.table(table).delete(id);
        } catch {
          // Ignora se não existir na tabela local
        }
        return;
      }
    }

    // Se estiver offline ou se a chamada falhou, remove localmente do Dexie
    try {
      await db.table(table).delete(id);
    } catch {
      // Ignora se não existir na tabela local
    }
  } catch (err) {
    console.error("Erro ao sincronizar exclusão com o Supabase:", err);
    try {
      await db.table(table).delete(id);
    } catch {
      // Ignora
    }
  }
}
