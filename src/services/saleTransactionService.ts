import { OfflineStorage, OfflineSale } from "./offlineStorage";
import { SyncManager } from "./syncManager";

export interface SaleTransactionResult {
  success: boolean;
  offline: boolean;
  message?: string;
  saleId?: string;
  data?: unknown;
}

/**
 * Submissão resiliente de transações de venda no PDV Masakula
 * Grava diretamente no IndexedDB quando offline ou como fallback em caso de instabilidade de rede.
 */
export async function submitSaleTransaction(
  salePayload: Record<string, unknown>
): Promise<SaleTransactionResult> {
  // Se estiver sem internet, grava direto no IndexedDB
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const offlineItem: OfflineSale = await OfflineStorage.saveSale(salePayload);
    return {
      success: true,
      offline: true,
      message: "Venda registada em modo offline. Será sincronizada automaticamente.",
      saleId: offlineItem.id,
    };
  }

  try {
    const res = await fetch("/api/sales/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(salePayload),
    });

    if (!res.ok) throw new Error("Falha no servidor");

    return {
      success: true,
      offline: false,
      data: await res.json(),
    };
  } catch (error) {
    // Fallback: Se a requisição falhar por perda súbita de rede ou timeout
    const offlineItem: OfflineSale = await OfflineStorage.saveSale(salePayload);
    return {
      success: true,
      offline: true,
      message: "Rede instável. Venda gravada offline.",
      saleId: offlineItem.id,
    };
  }
}

export default submitSaleTransaction;
