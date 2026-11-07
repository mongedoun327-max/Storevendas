"use client";

import React, { useState, useEffect, useRef } from "react";
import { BoxIcon, BoxesIcon, DeleteIcon, CogIcon } from "@/components/icons";
import { Plus, AlertTriangle, AlertOctagon, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductFormModal, ProductFormData } from "@/components/ProductFormModal";

// Catálogo de produtos (inicia vazio para folha em branco)
const MOCK_PRODUCTS: any[] = [];

export interface PageToast {
  id: string;
  type: 'critical_stock' | 'out_of_stock' | 'success';
  title: string;
  message: string;
  productName?: string;
  currentStock?: number;
  minStock?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export default function ProductsPage() {
  const [productsList, setProductsList] = useState(MOCK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<PageToast[]>([]);

  const initialAlertRef = useRef(false);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showCriticalStockToast = (name: string, stock: number, minStock: number) => {
    const isOut = stock <= 0;
    const id = `toast-${Date.now()}`;
    const newToast: PageToast = {
      id,
      type: isOut ? 'out_of_stock' : 'critical_stock',
      title: isOut ? '🚨 Estoque Esgotado' : '⚠️ Nível Crítico de Estoque',
      message: isOut
        ? `O produto "${name}" está sem estoque (0 unid).`
        : `O produto "${name}" atingiu o nível crítico (${stock} de mín. ${minStock} unid).`,
      productName: name,
      currentStock: stock,
      minStock: minStock,
      actionLabel: 'Ver Estoque Baixo',
      onAction: () => {
        setFilterLowStock(true);
        removeToast(id);
      }
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => removeToast(id), 6000);
  };

  useEffect(() => {
    if (!initialAlertRef.current && productsList.length > 0) {
      initialAlertRef.current = true;
      const critical = productsList.filter(p => p.current_stock <= p.min_stock);
      if (critical.length > 0) {
        critical.forEach(p => {
          showCriticalStockToast(p.name, p.current_stock, p.min_stock);
        });
      }
    }
  }, [productsList]);

  const filteredProducts = productsList.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock = filterLowStock ? product.current_stock <= product.min_stock : true;
    return matchesSearch && matchesStock;
  });

  const handleSaveNewProduct = (formData: ProductFormData) => {
    const newProduct = {
      id: String(Date.now()),
      name: formData.name,
      sku: `MSK-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `560${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: formData.category || "Geral",
      cost_price: formData.price * 0.7,
      selling_price: formData.price,
      current_stock: 0,
      min_stock: 5,
      tax_rate: "NOR_14",
      is_active: true,
    };
    setProductsList([newProduct, ...productsList]);
    if (newProduct.current_stock <= newProduct.min_stock) {
      showCriticalStockToast(newProduct.name, newProduct.current_stock, newProduct.min_stock);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#131313] text-white min-h-screen relative">
      {/* Visual Toast Notification Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl p-4 shadow-2xl border transition-all animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-2 ${
              toast.type === 'out_of_stock'
                ? 'bg-neutral-900 text-white border-rose-500/50'
                : 'bg-neutral-900 text-white border-amber-500/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  toast.type === 'out_of_stock' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
                }`}>
                  {toast.type === 'out_of_stock' ? <AlertOctagon size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">{toast.title}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[9px] font-black uppercase">
                      Crítico
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300">{toast.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            {toast.onAction && (
              <div className="flex justify-end pt-1 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={toast.onAction}
                  className="px-3 py-1 bg-[#E1FB15] text-black rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>{toast.actionLabel}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Cabeçalho do Módulo */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E1FB15]/10 text-[#E1FB15]">
            <BoxIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Gestão de Produtos</h1>
            <p className="text-xs text-neutral-400">
              Catálogo de artigos, preços de venda e controlo de estoque
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#E1FB15] px-4 py-2.5 text-xs font-bold text-black shadow-lg shadow-[#E1FB15]/20 hover:bg-[#d6f00f] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Novo Produto</span>
        </button>
      </div>

      {isModalOpen && (
        <ProductFormModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNewProduct}
        />
      )}

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400">Total de Produtos</span>
            <p className="text-xl font-bold text-white mt-1">{productsList.length}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
            <BoxIcon size={18} />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400">Estoque Crítico</span>
            <p className="text-xl font-bold text-rose-400 mt-1">
              {productsList.filter((p) => (p.current_stock ?? 0) <= (p.min_stock ?? 5)).length} Artigos
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <BoxesIcon size={18} />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400">Valor do Inventário</span>
            <p className="text-xl font-bold text-[#32D583] mt-1">
              {productsList.reduce((acc, p) => acc + ((p.current_stock ?? 0) * (p.cost_price ?? 0)), 0).toLocaleString()} Kz
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-[#32D583]/10 flex items-center justify-center text-[#32D583]">
            <CogIcon size={18} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
        <input
          type="text"
          placeholder="Buscar por nome, SKU ou código de barras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
        />

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold border transition-all cursor-pointer",
              filterLowStock
                ? "bg-rose-500/10 border-rose-500 text-rose-400"
                : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
            )}
          >
            Apenas Estoque Baixo
          </button>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="bg-neutral-900 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Preço Custo</th>
              <th className="px-4 py-3">Preço Venda</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-500 text-xs">
                  Nenhum produto cadastrado no catálogo.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
              const isLowStock = product.current_stock <= product.min_stock;

              return (
                <tr key={product.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{product.name}</span>
                      <span className="text-[10px] text-neutral-500">{product.sku}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">{product.cost_price.toLocaleString()} Kz</td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {product.selling_price.toLocaleString()} Kz
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isLowStock
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-[#32D583]/10 text-[#32D583] border border-[#32D583]/20"
                      )}
                    >
                      {product.current_stock} Unid.
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer" title="Configurar">
                        <CogIcon size={16} />
                      </button>
                      <button className="p-1 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer" title="Eliminar">
                        <DeleteIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { ProductsPage };
