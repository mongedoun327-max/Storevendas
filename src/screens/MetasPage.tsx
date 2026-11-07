import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { 
  Target, 
  Plus, 
  RefreshCw, 
  Cloud, 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
  Zap,
  Info,
  DollarSign,
  Trophy,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CreateMetaModal } from "../components/admin/CreateMetaModal";

export interface MetaItem {
  id?: string | number;
  title: string;
  target_amount: number;
  current_amount?: number;
  period?: string;
  created_at?: string;
}

export default function MetasPage() {
  const [metas, setMetas] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Função para procurar as metas no Supabase
  const fetchMetas = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar metas:", error);
        setErrorMsg(error.message);
      } else {
        setMetas(data || []);
      }
    } catch (err: any) {
      console.error("Erro inesperado ao consultar Supabase:", err);
      setErrorMsg(err.message || "Erro de conexão com o banco de dados");
    } finally {
      setLoading(false);
    }
  };

  // Carrega automaticamente ao atualizar a página (F5 / mount)
  useEffect(() => {
    fetchMetas();
  }, []);

  const handleDelete = async (id?: string | number) => {
    if (!id) return;
    if (!confirm("Deseja realmente eliminar esta meta?")) return;

    try {
      const { error } = await supabase.from("metas").delete().eq("id", id);
      if (error) {
        alert(`Erro ao eliminar: ${error.message}`);
      } else {
        fetchMetas();
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const formatKz = (val?: number) => {
    return (val || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Kz";
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
            <Target size={24} className="text-[#E1FB15]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">Gestão de Metas na Nuvem</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Cloud size={11} className="text-emerald-600" /> Supabase Conectado
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Metas sincronizadas e persistentes em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchMetas}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            title="Recarregar Metas"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-zinc-950" : ""} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-black text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
          >
            <Plus size={15} className="text-[#E1FB15]" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* Alerta de Erro se houver */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Lista / Grelha de Metas */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 p-8 space-y-3">
          <RefreshCw size={28} className="text-zinc-900 animate-spin" />
          <p className="text-xs font-bold text-zinc-600">A carregar metas do Supabase...</p>
        </div>
      ) : metas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-gray-100 flex items-center justify-center text-zinc-400">
            <Target size={28} />
          </div>
          <h3 className="font-extrabold text-base text-zinc-900">Nenhuma meta registada na nuvem</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            Clique em "Nova Meta" para criar o seu primeiro objetivo de faturação sincronizado diretamente no banco de dados.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 bg-[#E1FB15] text-black font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#d4ec13] transition cursor-pointer"
          >
            Criar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {metas.map((meta) => {
            const current = meta.current_amount || 0;
            const target = meta.target_amount || 1;
            const pct = Math.min(100, Math.round((current / target) * 100));
            const remaining = Math.max(0, target - current);
            const isCompleted = current >= target || pct >= 100;
            const surplus = isCompleted ? current - target : 0;
            const createdAtFormatted = meta.created_at
              ? new Date(meta.created_at).toLocaleDateString("pt-PT", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Hoje";

            return (
              <motion.div
                key={meta.id || meta.title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`group relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between ${
                  isCompleted
                    ? "bg-gradient-to-b from-emerald-50/50 via-white to-white border-2 border-emerald-500 ring-2 ring-emerald-500/15 shadow-lg shadow-emerald-500/10"
                    : "bg-white border border-gray-100 hover:border-zinc-950/20 hover:shadow-xl shadow-xs"
                }`}
              >
                {/* SELO DE DESTAQUE "META BATIDA" NO TOPO DIREITO SE 100%+ */}
                {isCompleted && (
                  <div className="absolute -top-3 right-6 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-600/30 border border-emerald-400">
                    <Trophy size={12} className="text-[#E1FB15]" />
                    <span>Meta Batida</span>
                  </div>
                )}

                {/* TOOLTIP FLUTUANTE NO HOVER COM DETALHES DE DATAS E PROCESSO */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-30 whitespace-nowrap bg-zinc-950 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl shadow-xl border border-zinc-800 flex items-center gap-2">
                  {isCompleted ? (
                    <>
                      <Trophy size={13} className="text-[#E1FB15]" />
                      <span className="text-[#32D583]">🏆 META BATIDA COM SUCESSO!</span>
                      <span className="text-zinc-500">•</span>
                      <span>Criada: {createdAtFormatted}</span>
                    </>
                  ) : (
                    <>
                      <Clock size={12} className="text-[#E1FB15]" />
                      <span>Criada em: {createdAtFormatted}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-[#32D583]">Faltam {formatKz(remaining)}</span>
                    </>
                  )}
                  {/* Seta do tooltip */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-950 rotate-45 border-r border-b border-zinc-800" />
                </div>

                <div className="space-y-4">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-gray-200">
                          {meta.period === "daily" ? "Diário" : meta.period === "weekly" ? "Semanal" : meta.period === "annual" ? "Anual" : "Mensal"}
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <Sparkles size={11} className="text-emerald-700" /> 100% Concluída
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-base text-zinc-950 leading-snug tracking-tight">{meta.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(meta.id)}
                      className="p-2 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Eliminar Meta"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Barra de Progresso & Valores Principais */}
                  <div className={`space-y-2.5 p-4 rounded-2xl border ${
                    isCompleted ? "bg-emerald-50/70 border-emerald-200/80" : "bg-zinc-50/80 border-gray-100"
                  }`}>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Valor Alvo</span>
                        <span className="text-base font-black text-zinc-950 tracking-tight">{formatKz(meta.target_amount)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Atingido</span>
                        <span className={`text-xs font-black ${isCompleted ? 'text-emerald-700 font-extrabold' : 'text-emerald-600'}`}>{pct}%</span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-zinc-200/80 overflow-hidden p-0.5">
                      <motion.div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : "bg-gradient-to-r from-emerald-500 via-teal-400 to-[#E1FB15]"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-zinc-500 font-medium">Acumulado: <strong className="text-zinc-800">{formatKz(current)}</strong></span>
                      <span className={`font-bold ${isCompleted ? 'text-emerald-700 flex items-center gap-1' : 'text-amber-600'}`}>
                        {isCompleted ? (
                          <>
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Alvo Atingido</span>
                          </>
                        ) : (
                          `Faltam ${formatKz(remaining)}`
                        )}
                      </span>
                    </div>
                  </div>

                  {/* PAINEL EXPANSÍVEL NO HOVER COM DETALHES DE CRIAÇÃO E RESTANTE EM KZ */}
                  <div className="overflow-hidden max-h-0 group-hover:max-h-48 transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-100">
                    <div className="pt-2 border-t border-dashed border-gray-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 text-white shadow-xs">
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-medium">
                          {isCompleted ? <Trophy size={13} className="text-[#E1FB15]" /> : <DollarSign size={13} className="text-[#E1FB15]" />}
                          {isCompleted ? "Status da Meta:" : "Restante para a meta:"}
                        </span>
                        <span className="font-black text-[#E1FB15] tracking-tight">
                          {isCompleted ? (surplus > 0 ? `Superada (+${formatKz(surplus)})` : "Meta Atingida a 100%") : formatKz(remaining)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-zinc-400" />
                          Criado em:
                        </span>
                        <span className="font-semibold text-zinc-700">{createdAtFormatted}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={12} className="text-zinc-400" />
                    {meta.created_at ? new Date(meta.created_at).toLocaleDateString("pt-PT") : "Hoje"}
                  </span>
                  {isCompleted ? (
                    <span className="flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Award size={12} /> Meta Batida
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-bold text-zinc-700 group-hover:text-zinc-950 transition">
                      Passe o mouse para detalhes
                      <ArrowRight size={11} className="transform group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md">
            <CreateMetaModal
              onClose={() => setIsModalOpen(false)}
              onMetaCreated={() => {
                setIsModalOpen(false);
                fetchMetas();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

