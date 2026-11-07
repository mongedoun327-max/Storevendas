import React from "react";
import { Info } from "lucide-react";
import { BreakageSummaryCharts } from "./BreakageSummaryCharts";
import { useBreakageSummary } from "../hooks/useBreakageSummary";

export function ShiftAnalyticsPage() {
  const now = new Date();
  const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const periodLabel = new Intl.DateTimeFormat("pt-AO", { month: "long", year: "numeric" }).format(now);
  const { data, loading } = useBreakageSummary({ periodMonth });

  return (
    <section className="workspace-view space-y-4" aria-label="Auditoria de caixas">
      <p role="note" className="flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-5 text-zinc-700">
        <Info size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-zinc-500" />
        <span>Comparação por operador indisponível. Quebras por motivo em {periodLabel}.</span>
      </p>
      <BreakageSummaryCharts data={data || []} isLoading={loading} />
    </section>
  );
}

export default ShiftAnalyticsPage;
