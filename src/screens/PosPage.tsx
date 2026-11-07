import React, { useState, useMemo } from "react";
import { useProducts, Product } from "../hooks/useProducts";
import { ProductCarousel3D } from "../components/pdv/carousel-3d";
import { 
  Search, 
  Barcode, 
  ShoppingCart, 
  Plus, 
  Package, 
  Loader2,
  Trash2,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { ReceiptModal } from "../components/ReceiptModal";
import { ReceiptData } from "@/lib/printerService";
import { usePosShortcuts } from "@/hooks/usePosShortcuts";

export function PosPage() {
  const { products, topProducts, loading } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [drawerAlert, setDrawerAlert] = useState<string | null>(null);

  // Atalho F9 para acionar abertura da Gaveta
  const { handleOpenDrawer } = usePosShortcuts({
    onOpenDrawerSuccess: () => {
      setDrawerAlert("Gaveta aberta com sucesso! (F9)");
      setTimeout(() => setDrawerAlert(null), 3000);
    },
    onOpenDrawerError: () => {
      setDrawerAlert("Comando de gaveta enviado.");
      setTimeout(() => setDrawerAlert(null), 3000);
    },
  });

  // Categorias únicas extraídas dos produtos reais
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category || "Geral")));
    return ["Todas", ...list];
  }, [products]);

  // Filtragem dinâmica por Nome, Código de Barras ou Categoria
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = p.name ? p.name.toLowerCase() : "";
      const code = p.code ? p.code.toLowerCase() : "";
      const search = searchTerm.toLowerCase();

      const matchesSearch = name.includes(search) || code.includes(search);
      const matchesCategory =
        selectedCategory === "Todas" || (p.category || "Geral") === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Função para adicionar ao carrinho
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price || 0) * item.quantity, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  return (
    <div className="p-4 sm:p-6 bg-neutral-950 min-h-screen text-white grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
      
      {/* 📦 COLUNA ESQUERDA E CENTRAL (CATÁLOGO & CARROSSEL 3D) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* 🎠 CARROSSEL 3D DO TOP 10 */}
        {!loading && topProducts.length > 0 && (
          <ProductCarousel3D products={topProducts} onAddToCart={handleAddToCart} />
        )}

        {/* 🔍 BARRA DE PESQUISA & FILTRO DE CATEGORIAS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            
            {/* Input de Pesquisa / Código de Barras */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou bipar código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-11 pr-10 py-3 text-xs text-white placeholder-neutral-500 focus:border-[#E1FB15] outline-none transition"
              />
              <Barcode className="w-4 h-4 text-neutral-500 absolute right-4 top-3.5" />
            </div>

            {/* Selector de Categoria */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#E1FB15] text-black shadow-md shadow-[#E1FB15]/10"
                      : "bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🛍️ GRELHA DE PRODUTOS VINDOS DO SUPABASE */}
        {loading ? (
          <div className="h-64 bg-neutral-900 border border-neutral-800 rounded-3xl flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#E1FB15] animate-spin" />
            <p className="text-xs text-neutral-400 font-bold">A carregar produtos da nuvem...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Package className="w-10 h-10 text-neutral-600" />
            <h4 className="text-sm font-bold text-neutral-300">Nenhum produto encontrado</h4>
            <p className="text-xs text-neutral-500 max-w-sm">Tente ajustar a sua pesquisa por nome, código de barras ou trocar de categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-[#E1FB15]/40 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition group relative overflow-hidden"
              >
                {/* Imagem Transparente WebP */}
                <div className="w-full h-32 bg-neutral-950 border border-neutral-800/80 rounded-xl p-2 flex items-center justify-center mb-2 group-hover:scale-105 transition duration-300">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.9)]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 text-[10px] font-bold">
                      Sem Foto
                    </div>
                  )}
                </div>

                {/* Detalhes do Produto */}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white line-clamp-1">{product.name}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">Ref: {product.code || "N/A"}</p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-800">
                  <span className="text-xs font-black text-[#32D583]">
                    Kz {product.price ? product.price.toLocaleString("pt-AO") : "0"}
                  </span>

                  <button 
                    type="button"
                    aria-label="Adicionar produto"
                    className="p-1.5 bg-neutral-800 group-hover:bg-[#E1FB15] text-neutral-300 group-hover:text-black rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* 🛒 COLUNA DIREITA (CARRINHO DE COMPRAS / SESSÃO DO CAIXA) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between h-auto lg:h-[calc(100vh-3rem)] lg:sticky lg:top-6">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#E1FB15]" />
              <h3 className="text-base font-extrabold text-white">Venda Atual</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400">
                {totalItemsCount} itens
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[10px] text-neutral-500 hover:text-rose-400 transition"
                  title="Limpar Carrinho"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Lista do Carrinho */}
          <div className="space-y-3 mt-4 overflow-y-auto max-h-[50vh] pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 space-y-2">
                <Package className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-bold">Nenhum artigo selecionado</p>
                <p className="text-[10px] text-neutral-600">Clique nos produtos para adicionar ao caixa</p>
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-2xl border border-neutral-800 group"
                >
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 object-contain bg-neutral-900 rounded-lg p-1"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center text-neutral-600 text-[10px]">
                        Foto
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-white max-w-[120px] truncate">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-[#32D583] font-bold">
                        Kz {product.price ? product.price.toLocaleString("pt-AO") : "0"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#E1FB15]">x{quantity}</span>
                    <span className="text-xs font-extrabold text-white">
                      Kz {((product.price || 0) * quantity).toLocaleString("pt-AO")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(product.id)}
                      className="text-neutral-600 hover:text-rose-500 p-1 transition"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resumo Final e Botão de Cobrança */}
        <div className="pt-4 border-t border-neutral-800 space-y-3 mt-4 lg:mt-0">
          <div className="flex justify-between items-center">
            <span className="text-xs text-neutral-400 font-bold">Total a Cobrar</span>
            <span className="text-xl font-black text-[#E1FB15]">
              Kz {totalAmount.toLocaleString("pt-AO")}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="px-3 py-3.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="Abrir Gaveta de Dinheiro (F9)"
            >
              <span>Gaveta (F9)</span>
            </button>
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => {
                const currentReceipt: ReceiptData = {
                  companyName: "MASAKULA COMÉRCIO & SERVIÇOS",
                  nif: "5417082910",
                  saleId: `VENDA-${Date.now()}`,
                  operatorName: "Operador Principal",
                  items: cart.map(item => ({
                    name: item.product.name,
                    qty: item.quantity,
                    price: item.product.price || 0,
                  })),
                  total: totalAmount,
                  paymentMethod: "Numerário / TPA",
                };
                setReceiptData(currentReceipt);
                setCart([]);
              }}
              className="flex-1 bg-[#E1FB15] hover:bg-[#d4eb0f] disabled:opacity-40 text-black font-extrabold py-3.5 rounded-2xl transition shadow-lg shadow-[#E1FB15]/10 cursor-pointer disabled:cursor-not-allowed text-center"
            >
              Finalizar Pagamento (F12)
            </button>
          </div>
        </div>
      </div>

      {/* AVISO TOAST GAVETA F9 */}
      {drawerAlert && (
        <div className="fixed bottom-6 left-6 z-50 bg-neutral-900 border border-[#E1FB15]/50 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <span className="text-[#E1FB15]">⚡</span>
          <span>{drawerAlert}</span>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO DO RECIBO */}
      {receiptData && (
        <ReceiptModal
          data={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}

    </div>
  );
}

export default PosPage;
