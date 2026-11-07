import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { ProductCard, ProductCardItem } from "./ProductCard";

export interface ProductGridItem extends ProductCardItem {}

export interface ProductGridProps {
  products: ProductGridItem[];
  onAddToCart: (product: ProductGridItem) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Extrair categorias únicas dinamicamente
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category || "Geral")));
    return ["Todos", ...list];
  }, [products]);

  // Filtragem combinada por busca e categoria
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = p.name || "";
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
      const category = p.category || "Geral";
      const matchesCategory =
        selectedCategory === "Todos" || category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900 p-6 overflow-hidden">
      {/* Barra de Pesquisa e Filtros de Categoria */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Pesquisar produto por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#E1FB15] text-black"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards de Produtos */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-neutral-500 text-sm">
            Nenhum produto encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductGrid;
