import React, { useState } from "react";
import { Plus, PackagePlus } from "lucide-react";
import { ProductFormModal } from "../components/admin/ProductFormModal";
import { StockEntryModal, StockEntryData } from "../components/admin/StockEntryModal";

export function ProductsManagementPage() {
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isStockEntryModalOpen, setIsStockEntryModalOpen] = useState(false);

  const handleSaveProduct = async (productData: any) => {
    // Recarregar a lista de produtos após guardar
    console.log("Novo produto criado:", productData);
  };

  const handleSaveStockEntry = (stockData: StockEntryData) => {
    console.log("Entrada de stock registada:", stockData);
  };

  return (
    <div className="p-6 bg-neutral-950 min-h-screen text-white">
      {/* Cabeçalho de Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Produtos</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Gestão de inventário, preços e imagens dos artigos
          </p>
        </div>

        {/* Grupo de Botões Principais */}
        <div className="flex items-center gap-3">
          {/* Botão Existente: Entrada de Stock */}
          <button
            type="button"
            onClick={() => setIsStockEntryModalOpen(true)}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2.5 rounded-xl text-xs font-semibold border border-neutral-700 transition cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Entrada de Stock</span>
          </button>

          {/* Botão Novo: Cadastrar Novo Produto */}
          <button
            type="button"
            onClick={() => setIsNewProductModalOpen(true)}
            className="flex items-center gap-2 bg-[#E1FB15] hover:bg-opacity-90 text-black px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Modais de Ação */}
      {isNewProductModalOpen && (
        <ProductFormModal
          onClose={() => setIsNewProductModalOpen(false)}
          onSave={handleSaveProduct}
        />
      )}

      {isStockEntryModalOpen && (
        <StockEntryModal
          onClose={() => setIsStockEntryModalOpen(false)}
          onSave={handleSaveStockEntry}
        />
      )}
    </div>
  );
}

export default ProductsManagementPage;
