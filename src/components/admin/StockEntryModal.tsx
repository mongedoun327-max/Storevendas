import React, { useState } from "react";
import { X, PackagePlus, ArrowDownLeft } from "lucide-react";

export interface StockEntryData {
  productId?: string;
  productName: string;
  quantity: number;
  costPrice?: number;
  supplier?: string;
  notes?: string;
}

export interface StockEntryModalProps {
  onClose: () => void;
  onSave?: (data: StockEntryData) => void;
}

export function StockEntryModal({ onClose, onSave }: StockEntryModalProps) {
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: StockEntryData = {
      productName,
      quantity: parseInt(quantity, 10) || 0,
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      supplier: supplier || undefined,
      notes: notes || undefined,
    };

    if (onSave) {
      onSave(payload);
    }
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-zinc-200 text-zinc-900 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Entrada de Stock</h3>
              <p className="text-[11px] text-zinc-500">Registo de entrada de mercadorias no inventário</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Produto / Artigo
            </label>
            <input
              required
              type="text"
              value={productName}
              placeholder="Ex: Cerveja Cuca 330ml ou Código"
              onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-xl p-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Quantidade
              </label>
              <input
                required
                type="number"
                min="1"
                value={quantity}
                placeholder="Ex: 50"
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-xl p-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Custo Unitário (Kz)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={costPrice}
                placeholder="Ex: 350"
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-xl p-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Fornecedor (Opcional)
            </label>
            <input
              type="text"
              value={supplier}
              placeholder="Ex: Distribuidora Luanda Lda"
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-xl p-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Observações / N.º Guia
            </label>
            <input
              type="text"
              value={notes}
              placeholder="Ex: Guia de remessa GR-2026/049"
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-xl p-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold py-2.5 rounded-xl border border-zinc-200 text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "A registar..." : "Confirmar Entrada"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockEntryModal;
