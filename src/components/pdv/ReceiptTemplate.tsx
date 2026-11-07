"use client";

import React from "react";

export interface SaleReceiptData {
  receiptId: string;
  date: string;
  storeName: string;
  nif: string;
  address: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  operator: string;
}

interface ReceiptTemplateProps {
  data: SaleReceiptData;
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ data }, ref) => (
    <div
      ref={ref}
      className="w-[80mm] select-none bg-white p-3 font-mono text-[11px] leading-tight text-black"
      style={{ margin: "0 auto" }}
    >
      <div className="mb-3 border-b border-dashed border-black pb-2 text-center">
        <h1 className="text-sm font-extrabold uppercase">{data.storeName}</h1>
        <p className="text-[10px]">NIF: {data.nif}</p>
        <p className="text-[10px] leading-3">{data.address}</p>
      </div>

      <div className="mb-2 text-[10px]">
        <p><strong>Recibo nº:</strong> {data.receiptId}</p>
        <p><strong>Data:</strong> {data.date}</p>
        <p><strong>Operador:</strong> {data.operator}</p>
      </div>

      <table className="mb-2 w-full border-b border-dashed border-black pb-2 text-left">
        <thead>
          <tr className="border-b border-black text-[10px]">
            <th className="py-1">QTD x ITEM</th>
            <th className="py-1 text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={`${item.name}-${index}`} className="align-top">
              <td className="py-1 pr-1">
                <div>{item.name}</div>
                <div className="text-[9px] text-gray-700">
                  {item.quantity} x {item.price.toLocaleString("pt-AO")} Kz
                </div>
              </td>
              <td className="py-1 text-right font-bold">
                {item.subtotal.toLocaleString("pt-AO")} Kz
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-3 space-y-1 border-b border-dashed border-black pb-2 text-[11px]">
        <div className="flex justify-between pt-1 text-xs font-extrabold">
          <span>TOTAL:</span>
          <span>{data.totalAmount.toLocaleString("pt-AO")} Kz</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Forma Pagamento:</span>
          <span>{data.paymentMethod}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Valor Entregue:</span>
          <span>{data.amountPaid.toLocaleString("pt-AO")} Kz</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Troco:</span>
          <span>{data.change.toLocaleString("pt-AO")} Kz</span>
        </div>
      </div>

      <div className="space-y-1 pt-1 text-center text-[9px]">
        <p className="font-bold">Obrigado pela preferência!</p>
        <p className="text-[8px] text-gray-600">Processado por programa certificado nº 000/AGT</p>
      </div>
    </div>
  )
);

ReceiptTemplate.displayName = "ReceiptTemplate";
