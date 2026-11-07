import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface PosCheckoutCartItem {
  id: string;
  name?: string;
  quantity: number;
  price: number;
  [key: string]: any;
}

export interface PosCheckoutOptions {
  paymentMethod?: string;
  customerName?: string;
  customerNif?: string;
  invoiceNumber?: string;
  onSessionExpired?: () => void;
  onNavigateToLogin?: () => void;
}

export function usePosCheckout(options?: PosCheckoutOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);

  const handleCompleteSale = async (
    cartItems: PosCheckoutCartItem[],
    totalAmount: number,
    saleOptions?: Partial<PosCheckoutOptions>
  ) => {
    try {
      setIsProcessing(true);

      // 1. Recuperar o operador ativo do localStorage
      const activeOperatorRaw = localStorage.getItem("active_operator");

      if (!activeOperatorRaw) {
        alert("Sessão expirada. Faça login novamente com o seu PIN.");
        if (saleOptions?.onSessionExpired || options?.onSessionExpired) {
          (saleOptions?.onSessionExpired || options?.onSessionExpired)?.();
        } else if (saleOptions?.onNavigateToLogin || options?.onNavigateToLogin) {
          (saleOptions?.onNavigateToLogin || options?.onNavigateToLogin)?.();
        } else if (typeof window !== 'undefined' && window.location) {
          // Fallback seguro em ambiente web SPA
          window.location.hash = "#login";
        }
        return null;
      }

      const activeOperator = JSON.parse(activeOperatorRaw);
      const paymentMethod = saleOptions?.paymentMethod || options?.paymentMethod || "cash";
      const invoiceNumber = saleOptions?.invoiceNumber || options?.invoiceNumber || `FT MAS26/${Math.floor(10000 + Math.random() * 90000)}`;

      // 2. Inserir o cabeçalho da venda com o operator_id
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          total: `${totalAmount} Kz`,
          operator_id: activeOperator.id, // <--- ID do operador vinculado aqui
          cashier_name: activeOperator.name || "Operador de Caixa",
          payment_method: paymentMethod,  // Ex: "cash", "multicaixa", etc.
          status: "completed",
          customer_name: saleOptions?.customerName || options?.customerName || "Consumidor Final",
          customer_nif: saleOptions?.customerNif || options?.customerNif || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 3. Inserir os itens da venda (sale_items)
      if (cartItems && cartItems.length > 0) {
        const saleItemsPayload = cartItems.map((item) => ({
          sale_id: sale.id,
          product_id: item.id,
          product_name: item.name || "Produto",
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from("sale_items")
          .insert(saleItemsPayload);

        if (itemsError) {
          console.warn("Aviso ao salvar sale_items detalhados:", itemsError);
        }
      }

      console.log(`Venda #${sale.id} registrada com sucesso pelo operador: ${activeOperator.name}`);
      setLastSaleId(sale.id);
      return sale;

    } catch (error) {
      console.error("Erro ao processar venda:", error);
      alert("Falha ao registrar venda.");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return { 
    handleCompleteSale,
    isProcessing,
    lastSaleId,
  };
}

export default usePosCheckout;
