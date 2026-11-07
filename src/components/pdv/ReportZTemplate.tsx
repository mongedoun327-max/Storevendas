"use client";

import React from "react";
import type { ShiftSummary } from "@/types/shift";

interface ReportZProps {
  data: ShiftSummary;
}

export const ReportZTemplate = React.forwardRef<HTMLDivElement, ReportZProps>(
  ({ data }, ref) => {
    const formatKz = (value: number) => `${value.toLocaleString("pt-AO")} Kz`;

    return (
      <div
        ref={ref}
        className="w-[80mm] select-none bg-white p-3 font-mono text-[11px] leading-tight text-black"
        style={{ margin: "0 auto" }}
      >
        <div className="mb-3 border-b border-black pb-2 text-center">
          <h1 className="text-sm font-extrabold uppercase">WORSCOI STORE</h1>
          <p className="text-[10px] font-bold">FECHO DE CAIXA - RELATÓRIO Z</p>
          <p className="text-[9px]">Turno ID: {data.shiftId.slice(0, 8)}</p>
        </div>

        <div className="mb-2 space-y-0.5 border-b border-dashed border-black pb-2 text-[10px]">
          <p><strong>Operador:</strong> {data.operatorName}</p>
          <p><strong>Abertura:</strong> {new Date(data.openedAt).toLocaleString("pt-AO")}</p>
          <p><strong>Fecho:</strong> {new Date(data.closedAt).toLocaleString("pt-AO")}</p>
          <p><strong>Qtd. Vendas:</strong> {data.salesCount}</p>
        </div>

        <div className="mb-2 flex justify-between text-[10px] font-bold">
          <span>Fundo de Caixa Inicial:</span>
          <span>{formatKz(data.openingFloat)}</span>
        </div>

        <table className="mb-2 w-full border-b border-dashed border-black pb-2 text-left">
          <thead>
            <tr className="border-b border-black text-[9px]">
              <th className="py-1">MEIO PAG.</th>
              <th className="text-right">SISTEMA</th>
              <th className="text-right">DECLAR.</th>
              <th className="text-right">DIF.</th>
            </tr>
          </thead>
          <tbody className="text-[10px]">
            <tr>
              <td className="py-1">Numerário*</td>
              <td className="text-right">{formatKz(data.expectedAmounts.numerario)}</td>
              <td className="text-right">{formatKz(data.declaredAmounts.numerario)}</td>
              <td className="text-right font-bold">{formatKz(data.discrepancies.numerario)}</td>
            </tr>
            <tr>
              <td className="py-1">Multicaixa</td>
              <td className="text-right">{formatKz(data.expectedAmounts.multicaixa)}</td>
              <td className="text-right">{formatKz(data.declaredAmounts.multicaixa)}</td>
              <td className="text-right font-bold">{formatKz(data.discrepancies.multicaixa)}</td>
            </tr>
            <tr>
              <td className="py-1">Transfer.</td>
              <td className="text-right">{formatKz(data.expectedAmounts.transferencia)}</td>
              <td className="text-right">{formatKz(data.declaredAmounts.transferencia)}</td>
              <td className="text-right font-bold">{formatKz(data.discrepancies.transferencia)}</td>
            </tr>
          </tbody>
        </table>

        <p className="mb-2 text-[8px] text-gray-600">* Inclui o fundo de caixa inicial.</p>

        <div className="mb-3 space-y-1 border-b border-black pb-2 text-[11px]">
          <div className="flex justify-between font-bold">
            <span>Total Faturado:</span>
            <span>{formatKz(data.expectedAmounts.total)}</span>
          </div>
          <div className="flex justify-between text-xs font-extrabold">
            <span>Diferença Geral:</span>
            <span className={data.discrepancies.total < 0 ? "text-rose-600" : ""}>
              {formatKz(data.discrepancies.total)}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-4 border-t border-dashed border-black pt-4 text-center">
          <div>
            <div className="mx-auto mb-1 w-48 border-b border-black" />
            <p className="text-[9px]">Assinatura do Operador</p>
          </div>
          <div>
            <div className="mx-auto mb-1 w-48 border-b border-black" />
            <p className="text-[9px]">Assinatura da Gerência</p>
          </div>
        </div>
      </div>
    );
  }
);

ReportZTemplate.displayName = "ReportZTemplate";
