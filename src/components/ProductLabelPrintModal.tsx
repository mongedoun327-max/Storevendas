import React, { useState } from 'react';
import { Tag, Printer, X } from 'lucide-react';

export interface ProductLabelData {
  name: string;
  price: number;
  code?: string;
  barcode?: string;
}

export interface ProductLabelPrintModalProps {
  product: { name: string; price: number; code?: string; barcode?: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductLabelPrintModal({ 
  product, 
  isOpen, 
  onClose 
}: ProductLabelPrintModalProps) {
  const [copies, setCopies] = useState(1);

  if (!isOpen || !product) return null;

  const displayCode = product.barcode || product.code || 'MSK-PRODUCT';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-sm flex items-center gap-2 text-black">
            <Tag size={16} /> Imprimir Etiquetas
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pré-visualização da Etiqueta */}
        <div id="printable-product-label" className="border-2 border-black p-3 rounded-xl text-center space-y-1 bg-gray-50">
          <p className="font-black text-xs uppercase truncate">{product.name}</p>
          <p className="text-lg font-black text-black">
            {product.price.toLocaleString('pt-AO')} Kz
          </p>
          <p className="text-[9px] font-mono tracking-widest text-gray-500">
            * {displayCode} *
          </p>
        </div>

        {/* Container exclusivo para impressão com repetição de cópias */}
        <div id="printable-product-labels-grid" className="hidden">
          {Array.from({ length: Math.max(1, copies) }).map((_, index) => (
            <div key={index} className="product-label-item border border-black p-2 text-center rounded m-1 inline-block w-[60mm] align-top bg-white">
              <p className="font-black text-[10px] uppercase truncate">{product.name}</p>
              <p className="text-sm font-black text-black my-1">
                {product.price.toLocaleString('pt-AO')} Kz
              </p>
              <p className="text-[8px] font-mono tracking-widest text-gray-600">
                * {displayCode} *
              </p>
              <p className="text-[6px] tracking-tight uppercase text-gray-500 font-bold mt-0.5">MASAKULA</p>
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs font-bold block mb-1 text-gray-700">Quantidade de Etiquetas</label>
          <input
            type="number"
            min="1"
            max="200"
            value={copies}
            onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
            className="w-full p-2.5 bg-gray-100 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <button
          onClick={() => window.print()}
          className="w-full py-3 bg-black text-[#E1FB15] font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-gray-800 transition cursor-pointer shadow-md"
        >
          <Printer size={16} /> Mandar Imprimir ({copies})
        </button>
      </div>
    </div>
  );
}

export default ProductLabelPrintModal;
