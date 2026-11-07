"use client";

import React, { useState } from "react";
import { 
  Vault, ArrowDownRight, ArrowUpRight, AlertTriangle, 
  Search, Eye, Calendar, FileText, CheckCircle2, Clock
} from "lucide-react";
import { ShiftRecord } from "@/types/shift";

// Turnos de Caixa (inicia vazio para folha em branco)
const MOCK_SHIFTS: ShiftRecord[] = [];

export default function ShiftHistoryPage() {
  const [shifts] = useState<ShiftRecord[]>(() => {
    try {
      const saved = localStorage.getItem("masakula_shift_records");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Aviso ao ler histórico de turnos:", e);
    }
    return MOCK_SHIFTS;
  });
  const [selectedShift, setSelectedShift] = useState<ShiftRecord | null>(null);
  const [search, setSearch] = useState("");

  const filteredShifts = shifts.filter(shift => 
    shift.operatorName.toLowerCase().includes(search.toLowerCase()) ||
    shift.terminalId.toLowerCase().includes(search.toLowerCase()) ||
    shift.id.toLowerCase().includes(search.toLowerCase())
  );

  // Métricas Consolidadas
  const totalSangrias = shifts.reduce((acc, s) => acc + s.totalSangria, 0);
  const totalReforcos = shifts.reduce((acc, s) => acc + s.totalReforco, 0);
  const totalQuebras = shifts.reduce((acc, s) => acc + (s.difference && s.difference < 0 ? Math.abs(s.difference) : 0), 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 space-y-8">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Histórico e Fecho de Caixas</h1>
          <p className="text-xs text-neutral-400">Auditoria de turnos, movimentos de Sangria/Reforço e quebras de caixa.</p>
        </div>
        <button 
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs px-4 py-2 rounded-xl transition cursor-pointer text-neutral-200 hover:text-white"
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          Exportar Relatório (PDF)
        </button>
      </div>

      {/* PAINEL DE KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-semibold mb-2">
            <span>Total Sangrias</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-white">{totalSangrias.toLocaleString("pt-AO")} Kz</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-semibold mb-2">
            <span>Total Reforços</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">{totalReforcos.toLocaleString("pt-AO")} Kz</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-semibold mb-2">
            <span>Quebras de Caixa</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">-{totalQuebras.toLocaleString("pt-AO")} Kz</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800/80 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-semibold mb-2">
            <span>Turnos Registados</span>
            <Vault className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">{shifts.length} Turnos</div>
        </div>
      </div>

      {/* TABELA DE AUDITORIA DE TURNOS */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar operador ou terminal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder:text-neutral-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/50 text-neutral-400 uppercase font-mono border-b border-neutral-800">
              <tr>
                <th className="p-4">Turno / Op.</th>
                <th className="p-4">Abertura / Fecho</th>
                <th className="p-4 text-right">Fundo Inicial</th>
                <th className="p-4 text-right">Vendas (Dinheiro)</th>
                <th className="p-4 text-right">Sangria / Reforço</th>
                <th className="p-4 text-right">Esperado vs Contado</th>
                <th className="p-4 text-right">Diferença</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400 font-medium">
                    Nenhum turno ou fecho de caixa registado no histórico.
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-neutral-800/30 transition">
                    <td className="p-4">
                      <div className="font-bold text-white">{shift.operatorName}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{shift.id} • {shift.terminalId}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-neutral-300">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {new Date(shift.openedAt).toLocaleTimeString("pt-AO", { hour: '2-digit', minute: '2-digit' })}
                        {" → "}
                        {shift.closedAt ? new Date(shift.closedAt).toLocaleTimeString("pt-AO", { hour: '2-digit', minute: '2-digit' }) : "Aberto"}
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono">{shift.initialCash.toLocaleString("pt-AO")} Kz</td>
                    <td className="p-4 text-right font-mono text-emerald-400">+{shift.salesCash.toLocaleString("pt-AO")} Kz</td>
                    <td className="p-4 text-right font-mono">
                      <span className="text-rose-400">-{shift.totalSangria.toLocaleString("pt-AO")}</span> /{" "}
                      <span className="text-emerald-400">+{shift.totalReforco.toLocaleString("pt-AO")}</span>
                    </td>
                    <td className="p-4 text-right font-mono">
                      <div>{shift.expectedCash.toLocaleString("pt-AO")} Kz</div>
                      <div className="text-[10px] text-neutral-400">Real: {shift.actualCash?.toLocaleString("pt-AO") ?? "—"} Kz</div>
                    </td>
                    <td className="p-4 text-right font-mono font-bold">
                      {shift.difference === null ? (
                        <span className="text-neutral-500">—</span>
                      ) : shift.difference === 0 ? (
                        <span className="text-emerald-400">0 Kz</span>
                      ) : shift.difference < 0 ? (
                        <span className="text-rose-400">{shift.difference.toLocaleString("pt-AO")} Kz</span>
                      ) : (
                        <span className="text-indigo-400">+{shift.difference.toLocaleString("pt-AO")} Kz</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedShift(shift)}
                        className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition cursor-pointer"
                        title="Ver Detalhes do Turno"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALHADO DO DIÁRIO DO TURNO */}
      {selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 w-full max-w-2xl rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Detalhamento do Turno #{selectedShift.id}</h3>
                <p className="text-xs text-zinc-500">Operador: {selectedShift.operatorName} | Terminal: {selectedShift.terminalId}</p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedShift(null)}
                className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 px-3 py-1.5 rounded-lg transition cursor-pointer font-semibold"
              >
                Fechar
              </button>
            </div>

            {/* RESUMO MÉTODOS DE PAGAMENTO */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <span className="text-zinc-500 block mb-1">Vendas em Dinheiro</span>
                <span className="text-base text-zinc-900 font-bold">{selectedShift.salesCash.toLocaleString("pt-AO")} Kz</span>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <span className="text-zinc-500 block mb-1">Vendas Multicaixa (TPA)</span>
                <span className="text-base text-indigo-600 font-bold">{selectedShift.salesCard.toLocaleString("pt-AO")} Kz</span>
              </div>
            </div>

            {/* HISTÓRICO DE SANGRIA E REFORÇO */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">
                Movimentos de Caixa (Sangrias / Reforços)
              </h4>
              {selectedShift.movements.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">Sem movimentos registados neste turno.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedShift.movements.map((mov) => (
                    <div 
                      key={mov.id} 
                      className="flex justify-between items-center p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {mov.type === "SANGRIA" ? (
                          <span className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg">
                            <ArrowDownRight className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg">
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        )}
                        <div>
                          <div className="font-semibold text-zinc-900">{mov.reason}</div>
                          <div className="text-[10px] text-zinc-400">
                            {new Date(mov.timestamp).toLocaleTimeString("pt-AO")} • Resp: {mov.operatorName}
                          </div>
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${mov.type === "SANGRIA" ? "text-rose-600" : "text-emerald-600"}`}>
                        {mov.type === "SANGRIA" ? "-" : "+"}{mov.amount.toLocaleString("pt-AO")} Kz
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
