"use client";

import React, { useState } from "react";
import { Scan, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { searchLocalProduct } from "@/services/productCacheService";
import { soundEffects } from "@/lib/audio/soundEffects";
import type { CachedProduct } from "@/lib/db/posDatabase";

interface ScannedCartItem extends CachedProduct {
  qty: number;
}

export function POSScreen() {
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cart, setCart] = useState<ScannedCartItem[]>([]);

  useBarcodeScanner({
    onScan: async (barcode) => {
      setLastScanned(barcode);
      const products = await searchLocalProduct(barcode);
      const product = products[0];

      if (!product) {
        soundEffects.playError();
        toast.error(`Produto com código de barras ${barcode} não foi encontrado.`);
        return;
      }

      if (product.stock_quantity <= 0) {
        soundEffects.playError();
        toast.error(`O produto ${product.name} está sem estoque disponível.`);
        return;
      }

      soundEffects.playSuccess();
      setCart((currentCart) => {
        const existingItem = currentCart.find((item) => item.id === product.id);
        if (existingItem) {
          if (existingItem.qty >= product.stock_quantity) return currentCart;
          return currentCart.map((item) => item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item);
        }
        return [...currentCart, { ...product, qty: 1 }];
      });
    },
  });

  const totalItems = cart.reduce((total, item) => total + item.qty, 0);

  return (
    <div className="flex h-screen w-full flex-col bg-[#131313] p-6 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E1FB15]/10 text-[#E1FB15]">
            <Scan className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">Leitor de Código de Barras Ativo</h2>
            <p className="text-xs text-gray-400">Pode bipar qualquer produto a qualquer momento</p>
          </div>
        </div>

        {lastScanned && (
          <span className="rounded-xl border border-[#32D583]/30 bg-[#32D583]/10 px-3 py-1 text-xs font-bold text-[#32D583]">
            Último Bip: {lastScanned}
          </span>
        )}
      </div>

      <div className="mt-6 flex-1 overflow-y-auto">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-400">
          <ShoppingCart className="h-4 w-4" /> Carrinho Atual ({totalItems})
        </h3>

        {cart.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-gray-500">
            <span>Aguardando leitura de produtos...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#181818] p-4">
                <div>
                  <p className="text-sm font-bold text-white">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.qty} x {item.price.toLocaleString("pt-AO")} Kz
                  </p>
                </div>
                <span className="text-sm font-extrabold text-[#E1FB15]">
                  {(item.qty * item.price).toLocaleString("pt-AO")} Kz
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
