import React from "react";
import { useCartStore } from "../store/use-cart-store";
import { ProductGrid } from "../components/ProductGrid";

// Produtos no PDV (inicia vazio para folha em branco)
export const MOCK_PRODUCTS: any[] = [];

export function PDVMainView() {
  const { addItem } = useCartStore();

  return (
    <div className="flex h-screen w-full bg-neutral-950 overflow-hidden">
      {/* Esquerda: Grid Dinâmico com Animações */}
      <ProductGrid
        products={MOCK_PRODUCTS}
        onAddToCart={(product) => {
          addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            imageUrl: product.imageUrl,
          });
        }}
      />

      {/* Direita: Carrinho Existente (Intacto) */}
      {/* <CartDrawer /> */}
    </div>
  );
}

export default PDVMainView;
