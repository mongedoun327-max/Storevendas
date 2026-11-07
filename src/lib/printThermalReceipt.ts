import type { SaleReceiptData } from "../components/pdv/ReceiptTemplate";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

export function printThermalReceipt(receiptData: SaleReceiptData): void {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=400,height=600");

  if (!printWindow) {
    window.alert("Por favor, permita pop-ups para imprimir o recibo.");
    return;
  }

  const itemsHtml = receiptData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 3px 0;">
          <div>${escapeHtml(item.name)}</div>
          <div style="font-size: 9px; color: #444;">
            ${item.quantity} x ${item.price.toLocaleString("pt-AO")} Kz
          </div>
        </td>
        <td style="text-align: right; font-weight: bold;">
          ${item.subtotal.toLocaleString("pt-AO")} Kz
        </td>
      </tr>
    `
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Recibo_${escapeHtml(receiptData.receiptId)}</title>
        <style>
          @page { size: 80mm auto; margin: 0mm; }
          body {
            width: 76mm;
            margin: 0 auto;
            padding: 5mm;
            color: #000;
            background: #fff;
            font-family: "Courier New", Courier, monospace;
            font-size: 11px;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .border-b {
            margin-bottom: 5px;
            padding-bottom: 5px;
            border-bottom: 1px dashed #000;
          }
          .flex { display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        <div class="text-center border-b">
          <h2 style="margin: 0; font-size: 14px;">${escapeHtml(receiptData.storeName)}</h2>
          <div>NIF: ${escapeHtml(receiptData.nif)}</div>
          <div>${escapeHtml(receiptData.address)}</div>
        </div>

        <div class="border-b" style="font-size: 10px;">
          <div><b>Recibo:</b> ${escapeHtml(receiptData.receiptId)}</div>
          <div><b>Data:</b> ${escapeHtml(receiptData.date)}</div>
          <div><b>Operador:</b> ${escapeHtml(receiptData.operator)}</div>
        </div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left;">QTD x ITEM</th>
              <th style="text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div class="border-b" style="margin-top: 8px;">
          <div class="flex font-bold" style="font-size: 12px;">
            <span>TOTAL:</span>
            <span>${receiptData.totalAmount.toLocaleString("pt-AO")} Kz</span>
          </div>
          <div class="flex">
            <span>Pagamento:</span>
            <span>${escapeHtml(receiptData.paymentMethod)}</span>
          </div>
          <div class="flex">
            <span>Entregue:</span>
            <span>${receiptData.amountPaid.toLocaleString("pt-AO")} Kz</span>
          </div>
          <div class="flex">
            <span>Troco:</span>
            <span>${receiptData.change.toLocaleString("pt-AO")} Kz</span>
          </div>
        </div>

        <div class="text-center" style="font-size: 9px; margin-top: 8px;">
          <p style="margin: 0;"><b>Obrigado pela preferência!</b></p>
          <p style="margin: 2px 0 0 0; font-size: 8px;">Processado por programa certificado nº 000/AGT</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
