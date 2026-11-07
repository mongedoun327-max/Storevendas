import React from "react";
import { Printer, X } from "lucide-react";
import { printReceiptWebUSB, ReceiptData } from "@/lib/printerService";

export interface ReceiptModalProps {
  data: ReceiptData;
  onClose: () => void;
}

export function ReceiptModal({ data, onClose }: ReceiptModalProps) {
  // Tentar Impressão Direta ESC/POS
  const handleDirectPrint = async () => {
    const success = await printReceiptWebUSB(data);
    if (!success) {
      // Se falhar a comunicação USB direta, abre o diálogo de impressão do browser
      window.print();
    }
  };

  return (
    <div id="receipt-modal-container" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      {/* PAINEL DE AÇÕES (ESCONDIDO NA IMPRESSÃO) */}
      <div className="bg-white border border-zinc-200 p-6 rounded-3xl max-w-sm w-full print:hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
            <Printer className="w-4 h-4 text-zinc-900" />
            Recibo da Venda
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-900 p-1 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PRÉ-VISUALIZAÇÃO DA TÉRMICA (80mm) */}
        <div className="bg-zinc-50 text-zinc-900 font-mono text-[11px] p-4 rounded-xl shadow-inner mb-4 overflow-y-auto max-h-80 leading-tight border border-zinc-200">
          <div className="text-center font-bold text-sm mb-1">{data.companyName}</div>
          <div className="text-center text-[10px] mb-2 text-zinc-600">NIF: {data.nif}</div>
          <div className="border-b border-dashed border-zinc-400 my-2" />
          <div>Venda: #{data.saleId ? data.saleId.slice(0, 8) : '0000'}</div>
          <div>Operador: {data.operatorName}</div>
          <div>Data: {new Date().toLocaleString("pt-AO")}</div>
          <div className="border-b border-dashed border-zinc-400 my-2" />

          <div className="space-y-1 my-2">
            {data.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-2">
                <span className="truncate">{item.qty}x {item.name}</span>
                <span className="shrink-0 font-medium">{(item.qty * item.price).toFixed(2)} Kz</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-zinc-400 my-2" />
          <div className="flex justify-between font-bold text-sm my-1">
            <span>TOTAL:</span>
            <span>{data.total.toFixed(2)} Kz</span>
          </div>
          <div className="text-[10px] text-zinc-600">Método: {data.paymentMethod}</div>
          <div className="border-b border-dashed border-zinc-400 my-2" />
          <div className="text-center my-2 font-bold text-[10px]">Obrigado pela preferência!</div>
          <div className="text-center text-[9px] text-zinc-400">Software Masakula ERP & PDV</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="py-3 bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl hover:bg-zinc-200 transition cursor-pointer border border-zinc-200 text-center"
          >
            Imprimir Driver
          </button>
          <button
            type="button"
            onClick={handleDirectPrint}
            className="py-3 bg-zinc-900 text-white font-bold text-xs rounded-xl hover:bg-zinc-800 transition shadow-md cursor-pointer text-center"
          >
            Imprimir ESC/POS
          </button>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO NATIVA (VISÍVEL APENAS NA IMPRESSÃO) */}
      <div 
        id="printable-escpos-receipt"
        className="hidden print:block p-4 text-black font-mono text-[11px] leading-tight mx-auto"
        style={{ width: '80mm' }}
      >
        <div className="text-center font-bold text-sm mb-1">{data.companyName}</div>
        <div className="text-center text-[10px] mb-2">NIF: {data.nif}</div>
        <div className="border-b border-dashed border-black my-2" />
        <div>Venda: #{data.saleId ? data.saleId.slice(0, 8) : '0000'}</div>
        <div>Operador: {data.operatorName}</div>
        <div>Data: {new Date().toLocaleString("pt-AO")}</div>
        <div className="border-b border-dashed border-black my-2" />

        <div className="space-y-1 my-2">
          {data.items.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{item.qty}x {item.name}</span>
              <span>{(item.qty * item.price).toFixed(2)} Kz</span>
            </div>
          ))}
        </div>

        <div className="border-b border-dashed border-black my-2" />
        <div className="flex justify-between font-bold text-sm my-1">
          <span>TOTAL:</span>
          <span>{data.total.toFixed(2)} Kz</span>
        </div>
        <div>Método: {data.paymentMethod}</div>
        <div className="border-b border-dashed border-black my-2" />
        <div className="text-center my-2 font-bold">Obrigado pela preferência!</div>
        <div className="text-center text-[9px]">Software Masakula ERP & PDV</div>
      </div>
    </div>
  );
}

export default ReceiptModal;
