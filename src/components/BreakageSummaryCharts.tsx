import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle } from "lucide-react";
import { BreakageReasonSummary, DivergenceReason } from "../types/audit";

const REASON_CONFIG: Record<DivergenceReason, { label: string; color: string }> = {
  damaged: { label: "Danificado", color: "#e11d48" },
  expired: { label: "Validade expirada", color: "#d97706" },
  stolen: { label: "Furto / roubo", color: "#7c3aed" },
  misplaced: { label: "Extravio", color: "#0284c7" },
  system_error: { label: "Erro de sistema", color: "#2563eb" },
  untracked_use: { label: "Uso interno", color: "#059669" },
  other: { label: "Outros", color: "#71717a" },
};

interface Props {
  data: BreakageReasonSummary[];
  isLoading?: boolean;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <circle cx={cx} cy={cy} r={innerRadius - 8} fill="#ffffff" />
      <text x={cx} y={cy - 7} textAnchor="middle" fill="#09090b" style={{ fontSize: 13, fontWeight: 700 }}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill="#52525b" style={{ fontSize: 10 }}>
        {payload.name?.length > 14 ? `${payload.name.slice(0, 13)}…` : payload.name}
      </text>
    </g>
  );
};

export function BreakageSummaryCharts({ data, isLoading }: Props) {
  const [chartMode, setChartMode] = useState<"share" | "amount">("share");
  const [activeIndex, setActiveIndex] = useState(0);

  const chartData = useMemo(() => data.map((item) => {
    const config = REASON_CONFIG[item.divergence_reason] || REASON_CONFIG.other;
    return {
      ...item,
      name: config.label,
      color: config.color,
      formattedAmount: `${Number(item.total_amount_lost).toLocaleString("pt-AO")} Kz`,
    };
  }), [data]);

  const totalLoss = useMemo(
    () => data.reduce((total, item) => total + Number(item.total_amount_lost), 0),
    [data],
  );

  if (isLoading || chartData.length === 0) {
    return (
      <div className="workspace-panel flex min-h-56 flex-col items-center justify-center gap-2 p-6 text-center">
        {isLoading ? (
          <>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" aria-hidden="true" />
            <p role="status" className="text-sm text-zinc-600">A carregar registos de quebras…</p>
          </>
        ) : (
          <>
            <AlertCircle size={22} aria-hidden="true" className="text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-800">Nenhuma quebra registada neste período.</p>
          </>
        )}
      </div>
    );
  }

  const CustomPie = Pie as any;

  return (
    <section className="workspace-panel space-y-4 p-4 sm:p-5" aria-label="Quebras por motivo">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-sm font-bold text-zinc-950">Quebras por motivo</h2>
          <span className="text-sm font-semibold tabular-nums text-zinc-700">
            {totalLoss.toLocaleString("pt-AO")} Kz
          </span>
        </div>
        <div className="inline-flex w-fit items-center gap-1 rounded-lg bg-zinc-100 p-1" aria-label="Formato do gráfico">
          <button
            type="button"
            onClick={() => setChartMode("share")}
            aria-pressed={chartMode === "share"}
            className={`min-h-9 rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${chartMode === "share" ? "bg-white text-zinc-950 shadow-xs" : "text-zinc-600 hover:text-zinc-950"}`}
          >
            Percentagem
          </button>
          <button
            type="button"
            onClick={() => setChartMode("amount")}
            aria-pressed={chartMode === "amount"}
            className={`min-h-9 rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${chartMode === "amount" ? "bg-white text-zinc-950 shadow-xs" : "text-zinc-600 hover:text-zinc-950"}`}
          >
            Valor (Kz)
          </button>
        </div>
      </div>

      <div className="h-72 w-full" role="group" aria-label={chartMode === "share" ? "Distribuição percentual das quebras por motivo" : "Valor perdido por motivo em Kwanzas"}>
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === "share" ? (
            <PieChart>
              <CustomPie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={chartData}
                dataKey="total_amount_lost"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={56}
                outerRadius={82}
                paddingAngle={3}
                onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`slice-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                ))}
              </CustomPie>
              <Tooltip formatter={(value: any) => [`${Number(value || 0).toLocaleString("pt-AO")} Kz`, "Perda"]} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 12, right: 12, left: 8, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} angle={-15} textAnchor="end" />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
              <Tooltip formatter={(value: any) => [`${Number(value || 0).toLocaleString("pt-AO")} Kz`, "Perda"]} />
              <ReferenceLine y={0} stroke="#d4d4d8" />
              <Bar dataKey="total_amount_lost" name="Valor perdido" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default BreakageSummaryCharts;
