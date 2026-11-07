import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { INITIAL_PRODUCTS } from "../data/mockData";

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  image_url: string;
  category: string;
  sales_count: number;
  is_featured: boolean;
}

const FALLBACK_PRODUCTS: Product[] = INITIAL_PRODUCTS.map((p, idx) => ({
  id: p.id,
  name: p.name,
  code: p.barcode || p.sku,
  price: p.salePrice,
  stock: p.stock,
  image_url: p.imageUrl || "",
  category: p.category,
  sales_count: 50 - idx * 4,
  is_featured: idx < 3,
}));

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sales_count", { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) {
          console.warn("Supabase products fetch notice (using fallback):", error.message);
        }
        setProducts(FALLBACK_PRODUCTS);
      } else {
        setProducts(data);
      }
    } catch (err) {
      console.warn("Erro ao buscar produtos, usando fallback:", err);
      setProducts(FALLBACK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Sincronização em Tempo Real (Realtime)
    const channelName = `products-changes-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Top 10 Produtos Mais Vendidos para o Carrossel 3D
  const topProducts = products.slice(0, 10);

  return { products, topProducts, loading, refetch: fetchProducts };
}

export default useProducts;
