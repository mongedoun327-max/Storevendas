"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";
import { printRawEscPos } from "@/lib/printer/webSerialPrinter";
import { generateSaleReceiptBuffer, type ReceiptSaleData } from "@/lib/printer/templates/saleReceipt";

interface PrintReceiptButtonProps {
  saleData: ReceiptSaleData;
}

export function PrintReceiptButton({ saleData }: PrintReceiptButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const buffer = generateSaleReceiptBuffer(saleData);
      const printed = await printRawEscPos(buffer, 9600);
      if (!printed) {
        window.alert("Não foi possível imprimir o talão.");
      }
    } catch (error) {
      console.error("Erro ao imprimir talão:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handlePrint()}
      disabled={isPrinting}
      className="flex items-center gap-2 rounded-2xl bg-[#E1FB15] px-4 py-2.5 text-xs font-extrabold text-black transition hover:bg-[#c9e20e] active:scale-95 disabled:opacity-50"
    >
      <Printer className={`h-4 w-4 ${isPrinting ? "animate-bounce" : ""}`} />
      <span>{isPrinting ? "A Imprimir..." : "Imprimir Talão (80mm)"}</span>
    </button>
  );
}
