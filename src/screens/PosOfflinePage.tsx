"use client";

import React, { useState } from "react";
import { Search, Package } from "lucide-react";
import { POSProduct, CartItem, PaymentMethod } from "@/types/pos";
import { POSCartSidebar } from "../components/pdv/POSCartSidebar";
import { POSCheckoutModal } from "../components/pdv/POSCheckoutModal";
import { saveSaleOffline } from "@/services/offlineSyncService";
import { decrementLocalStock } from "@/services/productCacheService";
import { createClient } from "@/lib/supabase/client";
import { useCachedProducts } from "@/hooks/useCachedProducts";

export default function PosOfflinePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { products, categories } = useCachedProducts(searchTerm, selectedCategory);

  const handleAddToCart = (product: POSProduct) => {
    if (product.stock <= 0) return;

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) return currentCart;
        const quantity = existingItem.quantity + 1;
        return currentCart.map((item) => item.product.id === product.id
          ? { ...item, quantity, subtotal: quantity * product.price }
          : item);
      }
      return [...currentCart, { product, quantity: 1, subtotal: product.price }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((currentCart) => currentCart.flatMap((item) => {
      if (item.product.id !== productId) return [item];
      const quantity = item.quantity + delta;
      if (quantity <= 0) return [];
      if (quantity > item.product.stock) return [item];
      return [{ ...item, quantity, subtotal: quantity * item.product.price }];
    }));
  };

  const handleConfirmSale = async (method: PaymentMethod, paid: number, change: number) => {
    await decrementLocalStock(
      cart.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
    );

    const salePayload = {
      tempId: crypto.randomUUID(),
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.subtotal,
      })),
      totalAmount,
      paymentMethod: method,
      amountPaid: paid,
      change,
      createdAt: new Date().toISOString(),
    };

    if (!navigator.onLine) {
      await saveSaleOffline(salePayload);
      window.alert("Venda gravada em modo offline. Será sincronizada automaticamente.");
    } else {
      try {
        const supabase = createClient();
        const { data: insertedSale, error: saleError } = await supabase
          .from("sales")
          .insert({
            total_amount: salePayload.totalAmount,
            payment_method: salePayload.paymentMethod,
            amount_paid: salePayload.amountPaid,
            change_amount: salePayload.change,
            created_at: salePayload.createdAt,
          })
          .select("id")
          .single();

        if (saleError) throw saleError;

        const { error: itemsError } = await supabase.from("sale_items").insert(
          salePayload.items.map((item) => ({
            sale_id: insertedSale.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.subtotal,
          }))
        );

        if (itemsError) throw itemsError;
        window.alert("Venda registada com sucesso!");
      } catch (error) {
        console.error("Falha ao enviar venda online:", error);
        await saveSaleOffline(salePayload);
        window.alert("Falha de rede. Venda guardada localmente para sincronização.");
      }
    }

    setCart([]);
    setIsCheckoutOpen(false);
  };

  const totalAmount = cart.reduce((total, item) => total + item.subtotal, 0);

  return (
    <div className="flex h-screen gap-4 overflow-hidden bg-[#0b0b0b] p-4 font-sans text-white">
      <div className="flex min-w-0 flex-1 flex-col space-y-4 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
          <input
            type="search"
            placeholder="Pesquisar produto por nome ou código de barras..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#131313] py-3 pl-11 pr-4 text-xs text-white placeholder-gray-500 focus:border-[#32D583] focus:outline-none"
            aria-label="Pesquisar produtos"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${selectedCategory === null ? "bg-white font-bold text-black" : "border border-white/10 bg-[#131313] text-gray-400 hover:text-white"}`}
          >
            Todos os Produtos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${selectedCategory === category.id ? "bg-[#32D583] font-bold text-black" : "border border-white/10 bg-[#131313] text-gray-300 hover:bg-white/5"}`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.colorHex }} />
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              disabled={product.stock <= 0}
              onClick={() => handleAddToCart(product)}
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131313] p-4 text-left transition hover:border-[#32D583]/50 hover:bg-[#181818] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-gray-500">Stock: {product.stock}</span>
                <h4 className="truncate text-xs font-bold text-white transition group-hover:text-[#32D583]">{product.name}</h4>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-[#32D583]">{product.price.toLocaleString("pt-AO")} Kz</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 transition group-hover:bg-[#32D583] group-hover:text-black">
                  <Package className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="h-full w-80 shrink-0 lg:w-96">
        <POSCartSidebar
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={(productId) => setCart((items) => items.filter((item) => item.product.id !== productId))}
          onClearCart={() => setCart([])}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
        />
      </div>

      <POSCheckoutModal
        isOpen={isCheckoutOpen}
        totalAmount={totalAmount}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirmSale={handleConfirmSale}
      />
    </div>
  );
}
