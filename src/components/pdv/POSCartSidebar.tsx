"use client";

import React from "react";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { CartItem } from "@/types/pos";

interface POSCartSidebarProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenCheckout: () => void;
}

export function POSCartSidebar({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenCheckout,
}: POSCartSidebarProps) {
  const totalAmount = items.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#131313] p-5 text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#32D583]/10 text-[#32D583]">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Carrinho de Compras</h2>
            <p className="text-[11px] text-gray-400">{totalItemsCount} itens selecionados</p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-[11px] font-semibold text-rose-400 transition hover:text-rose-300"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-white/10">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center text-gray-500">
            <ShoppingCart className="mb-2 h-12 w-12 stroke-[1] text-gray-600" />
            <p className="text-xs font-medium">O carrinho está vazio</p>
            <p className="text-[11px] text-gray-600">Selecione produtos para iniciar a venda</p>
          </div>
        ) : (
          items.map(({ product, quantity, subtotal }) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#181818] p-3 transition hover:border-white/10"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="truncate text-xs font-bold text-white">{product.name}</p>
                <p className="font-mono text-[11px] text-gray-400">
                  {product.price.toLocaleString("pt-AO")} Kz
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-white/10 bg-[#111]">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(product.id, -1)}
                    className="p-1.5 text-gray-400 transition hover:text-white"
                    aria-label={`Diminuir quantidade de ${product.name}`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center font-mono text-xs font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(product.id, 1)}
                    className="p-1.5 text-gray-400 transition hover:text-white"
                    aria-label={`Aumentar quantidade de ${product.name}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveItem(product.id)}
                  className="p-1.5 text-gray-500 transition hover:text-rose-400"
                  aria-label={`Remover ${product.name} do carrinho`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Subtotal</span>
          <span className="font-mono">{totalAmount.toLocaleString("pt-AO")} Kz</span>
        </div>
        <div className="flex items-center justify-between text-base font-extrabold text-white">
          <span>Total</span>
          <span className="font-mono text-lg text-[#32D583]">
            {totalAmount.toLocaleString("pt-AO")} Kz
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenCheckout}
          disabled={items.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#32D583] py-3.5 text-xs font-extrabold text-black transition hover:bg-[#28c072] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>Pagar {totalAmount > 0 ? `${totalAmount.toLocaleString("pt-AO")} Kz` : ""}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
