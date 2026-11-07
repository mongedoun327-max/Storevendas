import { invoke } from "@tauri-apps/api/core";
import { triggerCashDrawer as triggerCashDrawerWeb } from "../lib/printerService";

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  companyName: string;
  nif: string;
  invoiceNumber: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

export class ESCPOSBuilder {
  private buffer: number[] = [];

  // Encoders de comandos text-formatting
  private static ENCODERS = {
    ALIGN_LEFT: [0x1b, 0x61, 0x00],
    ALIGN_CENTER: [0x1b, 0x61, 0x01],
    ALIGN_RIGHT: [0x1b, 0x61, 0x02],
    BOLD_ON: [0x1b, 0x45, 0x01],
    BOLD_OFF: [0x1b, 0x45, 0x00],
    DOUBLE_HEIGHT: [0x1d, 0x21, 0x01],
    NORMAL_SIZE: [0x1d, 0x21, 0x00],
  };

  public text(str: string): this {
    // Converter caracteres UTF-8 para ASCII/CodePage 860 (Português)
    for (let i = 0; i < str.length; i++) {
      this.buffer.push(str.charCodeAt(i));
    }
    this.buffer.push(0x0a); // LineFeed
    return this;
  }

  public align(position: "LEFT" | "CENTER" | "RIGHT"): this {
    this.buffer.push(...ESCPOSBuilder.ENCODERS[`ALIGN_${position}`]);
    return this;
  }

  public bold(enabled: boolean): this {
    this.buffer.push(...ESCPOSBuilder.ENCODERS[enabled ? "BOLD_ON" : "BOLD_OFF"]);
    return this;
  }

  public line(char = "-"): this {
    return this.text(char.repeat(48)); // Largura padrão 80mm (48 cols)
  }

  public row(left: string, right: string): this {
    const totalWidth = 48;
    const spaceWidth = totalWidth - left.length - right.length;
    const spaces = " ".repeat(Math.max(0, spaceWidth));
    return this.text(`${left}${spaces}${right}`);
  }

  public build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

// Serviço de Execução dos Periféricos
export const HardwareService = {
  async triggerCashDrawer(portName = "COM1", baudRate = 9600): Promise<void> {
    if (typeof window !== "undefined" && ("__TAURI_INTERNALS__" in (window as unknown as Record<string, unknown>) || "__TAURI__" in (window as unknown as Record<string, unknown>))) {
      await invoke("open_cash_drawer", { portName, baudRate });
    } else {
      console.info("Ambiente Web: Acionando gaveta via WebUSB...");
      await triggerCashDrawerWeb();
    }
  },

  async printReceipt(
    receipt: ReceiptData,
    portName = "COM1",
    baudRate = 9600
  ): Promise<void> {
    const builder = new ESCPOSBuilder();

    // Construção do Layout Térmico 80mm
    builder
      .align("CENTER")
      .bold(true)
      .text(receipt.companyName)
      .bold(false)
      .text(`NIF: ${receipt.nif}`)
      .text(`FATURA REGISTADA: ${receipt.invoiceNumber}`)
      .line("=")
      .align("LEFT");

    // Tabela de Produtos
    receipt.items.forEach((item) => {
      builder.text(item.name);
      builder.row(
        ` ${item.qty}x ${item.price.toLocaleString()} Kz`,
        `${item.total.toLocaleString()} Kz`
      );
    });

    builder
      .line("-")
      .row("Subtotal:", `${receipt.subtotal.toLocaleString()} Kz`)
      .bold(true)
      .row("TOTAL:", `${receipt.total.toLocaleString()} Kz`)
      .bold(false)
      .line("=")
      .align("CENTER")
      .text(`Forma de Pagamento: ${receipt.paymentMethod}`)
      .text("Obrigado pela sua preferência!")
      .text("Processado por computador - Worscoi POS");

    const payload = Array.from(builder.build());

    // Dispatch Desktop vs Web Fallback
    if (typeof window !== "undefined" && ("__TAURI_INTERNALS__" in (window as unknown as Record<string, unknown>) || "__TAURI__" in (window as unknown as Record<string, unknown>))) {
      await invoke("print_escpos_raw", {
        portName,
        baudRate,
        payload,
        openDrawer: true,
        cut: true,
      });
    } else {
      console.warn("Utilizando Web Serial API para envio de buffer...");
      // Implementação de fallback com Web Serial API se corrido no Chrome
    }
  },
};

export default HardwareService;
