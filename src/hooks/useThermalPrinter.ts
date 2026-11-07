"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EscPosEncoder } from "@/utils/escposEncoder";
import { printViaWebSerial } from "@/utils/webSerialPrinter";
import { printViaWebUSB } from "@/utils/webUsbPrinter";
import type { SaleReceiptData } from "@/components/pdv/ReceiptTemplate";

type ThermalConnectionType = "serial" | "usb";

export function useThermalPrinter() {
  const [isPrinting, setIsPrinting] = useState(false);

  const buildReceiptBuffer = (data: SaleReceiptData): Uint8Array => {
    const encoder = new EscPosEncoder();

    encoder
      .initialize()
      .openCashDrawer()
      .align("center")
      .bold(true)
      .size(2, 2)
      .line(data.storeName)
      .size(1, 1)
      .bold(false)
      .line(`NIF: ${data.nif}`)
      .line(data.address)
      .line("--------------------------------")
      .align("left")
      .line(`Recibo: ${data.receiptId}`)
      .line(`Data:   ${data.date}`)
      .line(`Oper:   ${data.operator}`)
      .line("--------------------------------");

    data.items.forEach((item) => {
      encoder.line(item.name);
      const details = `${item.quantity} x ${item.price.toLocaleString("pt-AO")} Kz`;
      const subtotal = `${item.subtotal.toLocaleString("pt-AO")} Kz`;
      const spaces = " ".repeat(Math.max(0, 32 - details.length - subtotal.length));
      encoder.line(`${details}${spaces}${subtotal}`);
    });

    const total = `${data.totalAmount.toLocaleString("pt-AO")} Kz`;
    const totalSpaces = " ".repeat(Math.max(0, 32 - 7 - total.length));

    encoder
      .line("--------------------------------")
      .bold(true)
      .line(`TOTAL:${totalSpaces}${total}`)
      .bold(false)
      .line(`Pagamento: ${data.paymentMethod}`)
      .line(`Entregue:  ${data.amountPaid.toLocaleString("pt-AO")} Kz`)
      .line(`Troco:     ${data.change.toLocaleString("pt-AO")} Kz`)
      .line("--------------------------------")
      .align("center")
      .line("Obrigado pela preferência!")
      .line("Processado por programa certificado")
      .cut();

    return encoder.encode();
  };

  const printDirectly = async (
    data: SaleReceiptData,
    connectionType: ThermalConnectionType = "serial"
  ): Promise<void> => {
    try {
      setIsPrinting(true);
      const buffer = buildReceiptBuffer(data);

      if (connectionType === "serial") {
        await printViaWebSerial(buffer);
      } else {
        await printViaWebUSB(buffer);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Falha na impressão direta: ${message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  return { printDirectly, isPrinting };
}
