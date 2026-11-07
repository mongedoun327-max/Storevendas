"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export interface DiscrepancyItem {
  id: string;
  productName: string;
  negativeStock: number;
  saleDate: string;
}

interface StockDiscrepancyBannerProps {
  discrepancies: DiscrepancyItem[];
}

export function StockDiscrepancyBanner({
  discrepancies,
}: StockDiscrepancyBannerProps) {
  if (discrepancies.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider">
            Atenção: Conflito de Stock Offline ({discrepancies.length})
          </h4>
          <p className="text-xs text-amber-200/80">
            Foram sincronizadas vendas realizadas offline que excederam o stock real disponível.
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-amber-500/20 pt-2 text-xs">
        {discrepancies.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <span>{item.productName}</span>
            <span className="whitespace-nowrap font-mono font-bold text-rose-400">
              Stock atual: {item.negativeStock} un
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
