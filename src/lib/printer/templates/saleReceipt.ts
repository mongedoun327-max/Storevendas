import { EscPosBuilder } from "../escposBuilder";

export interface ReceiptSaleData {
  storeName: string;
  nif: string;
  address: string;
  receiptNumber: string;
  date: string;
  operatorName: string;
  items: Array<{ name: string; qty: number; price: number; total: number }>;
  totalAmount: number;
  paymentMethod: string;
}

export function generateSaleReceiptBuffer(data: ReceiptSaleData): Uint8Array {
  const builder = new EscPosBuilder();
  const formatKz = (value: number) => `${value.toLocaleString("pt-AO")} Kz`;

  builder
    .init()
    .align("center")
    .bold(true)
    .size(1, 1)
    .line(data.storeName)
    .size(0, 0)
    .bold(false)
    .line(`NIF: ${data.nif}`)
    .line(data.address)
    .line("------------------------------------------------")
    .bold(true)
    .line(`TALAO DE VENDA: ${data.receiptNumber}`)
    .bold(false)
    .line(`Data: ${data.date} | Op: ${data.operatorName}`)
    .line("------------------------------------------------")
    .align("left");

  data.items.forEach((item) => {
    builder.bold(true).line(item.name).bold(false);
    builder.row(`  ${item.qty} x ${formatKz(item.price)}`, formatKz(item.total));
  });

  builder
    .line("------------------------------------------------")
    .bold(true)
    .size(0, 1)
    .row("TOTAL:", formatKz(data.totalAmount))
    .size(0, 0)
    .bold(false)
    .row("Forma de Pagamento:", data.paymentMethod)
    .line("------------------------------------------------")
    .align("center")
    .feed(1)
    .line("Obrigado pela sua preferencia!")
    .line("Processado por computador - Worscoi POS")
    .feed(3)
    .cut();

  return builder.build();
}
