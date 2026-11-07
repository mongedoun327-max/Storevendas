"use client";

import React, { useRef } from "react";
import { Printer, Download, CheckCircle2 } from "lucide-react";
import { ReceiptTemplate, type SaleReceiptData } from "./ReceiptTemplate";
import { printThermalReceipt } from "@/lib/printThermalReceipt";
import { downloadReceiptPDF } from "@/lib/downloadReceiptPDF";

interface POSSuccessActionsProps {
  saleData: SaleReceiptData;
  onNewSale: () => void;
}

export function POSSuccessActions({ saleData, onNewSale }: POSSuccessActionsProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    printThermalReceipt(saleData);
  };

  const handleDownloadPDF = async () => {
    if (receiptRef.current) {
      await downloadReceiptPDF(receiptRef.current, saleData.receiptId);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 text-white">
      <div className="flex items-center gap-2 text-[#32D583]">
        <CheckCircle2 className="h-6 w-6" />
        <span className="text-base font-bold">Venda Concluída com Sucesso!</span>
      </div>

      <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
        <ReceiptTemplate ref={receiptRef} data={saleData} />
      </div>

      <div className="grid w-full max-w-xs grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#181818] py-3 text-xs font-bold text-white transition hover:border-[#32D583] hover:text-[#32D583]"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimir (80mm)</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPDF}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#181818] py-3 text-xs font-bold text-white transition hover:border-[#32D583] hover:text-[#32D583]"
        >
          <Download className="h-4 w-4" />
          <span>Baixar PDF</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onNewSale}
        className="w-full max-w-xs rounded-xl bg-[#32D583] py-3 text-xs font-extrabold text-black transition hover:bg-[#28c072]"
      >
        Iniciar Nova Venda
      </button>
    </div>
  );
}
