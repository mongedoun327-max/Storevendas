import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  TrendingUp,
  Flag,
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { formatKz, formatDate, formatDateTime } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import { CreateGoalModal, NewGoalDTO } from '../admin/CreateGoalModal';
import { AttendanceStatsModule } from './AttendanceStatsView';
import { SaleTransaction, Product } from '../../types';
import { getStoredUsers } from '../../utils/userAccounts';

export interface GoalItem {
  id: string;
  title: string;
  type: 'SALES' | 'PROFIT' | 'BOTH';
  attendantId: string;
  attendantName: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string;
  createdAt: string;
  notes?: string;
}

// Nomes em Português para datas
const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const FULL_MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export interface CalendarDayItem {
  id: string;
  dayLabel: string;
  dayNumber: number;
  monthLabel: string;
  fullFormatted: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  diffDays: number;
}

const INITIAL_GOALS: GoalItem[] = [];

function getCalendarDays(offsetWeek: number = 0): CalendarDayItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: CalendarDayItem[] = [];
  const baseOffset = offsetWeek * 7;
  for (let i = -4; i <= 2; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + baseOffset + i);
    d.setHours(0, 0, 0, 0);

    const isToday = d.getTime() === today.getTime();
    const isPast = d.getTime() < today.getTime();
    const isFuture = d.getTime() > today.getTime();
    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const id = `${year}-${month}-${day}`;

    days.push({
      id,
      dayLabel: WEEKDAY_NAMES[d.getDay()],
      dayNumber: d.getDate(),
      monthLabel: MONTH_NAMES[d.getMonth()],
      fullFormatted: `${d.getDate()} de ${FULL_MONTH_NAMES[d.getMonth()]}`,
      isToday,
      isPast,
      isFuture,
      diffDays,
    });
  }

  return days;
}

interface GoalsDashboardProps {
  sales?: SaleTransaction[];
  products?: Product[];
}

const GoalsDashboardView: React.FC<GoalsDashboardProps> = ({
  sales = [],
  products = [],
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const calendarDays = useMemo(() => getCalendarDays(weekOffset), [weekOffset]);

  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Carregar atendentes dinamicamente dos utilizadores do sistema
  const attendantOptions = useMemo(() => {
    try {
      const users = getStoredUsers();
      return users.map((u) => ({
        id: u.id,
        name: u.name,
      }));
    } catch (e) {
      return [];
    }
  }, []);

  const [goals, setGoals] = useState<GoalItem[]>(() => {
    try {
      const wasCleared = localStorage.getItem('masakula_goals_cleared');
      const isBlankSystem = localStorage.getItem('masakula_system_blank');
      if (wasCleared === 'true' || isBlankSystem === 'true') {
        return [];
      }
      const saved = localStorage.getItem('masakula_goals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar metas locais:', e);
    }
    return INITIAL_GOALS;
  });

  const [selectedGoalId, setSelectedGoalId] = useState<string>(() => {
    return goals[0]?.id || '';
  });

  const [goalsFilter, setGoalsFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  const selectedDayInfo = useMemo(() => {
    const found = calendarDays.find((d) => d.id === selectedDayKey);
    if (found) return found;

    const [year, month, day] = selectedDayKey.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const isToday = d.getTime() === now.getTime();
    const isPast = d.getTime() < now.getTime();
    const isFuture = d.getTime() > now.getTime();
    const diffDays = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: selectedDayKey,
      dayLabel: WEEKDAY_NAMES[d.getDay()],
      dayNumber: d.getDate(),
      monthLabel: MONTH_NAMES[d.getMonth()],
      fullFormatted: `${d.getDate()} de ${FULL_MONTH_NAMES[d.getMonth()]}`,
      isToday,
      isPast,
      isFuture,
      diffDays,
    };
  }, [calendarDays, selectedDayKey]);

  // Sincronização inicial com Supabase quando não limpo
  useEffect(() => {
    const isBlank = localStorage.getItem('masakula_system_blank') === 'true';
    const wasCleared = localStorage.getItem('masakula_goals_cleared') === 'true';
    if (isBlank || wasCleared) {
      return;
    }

    const saved = localStorage.getItem('masakula_goals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGoals(parsed);
          if (!selectedGoalId) setSelectedGoalId(parsed[0].id);
          return;
        }
      } catch (e) {
        // continua para o fetch
      }
    }

    async function loadMetasFromSupabase() {
      try {
        const { data, error } = await supabase.from('metas').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mappedGoals: GoalItem[] = data.map((g: any) => ({
            id: g.id ? String(g.id) : `goal-${Date.now()}`,
            title: g.title || 'Meta Comercial',
            type: (g.type || 'BOTH') as 'SALES' | 'PROFIT' | 'BOTH',
            attendantId: g.attendant_id || 'TODOS',
            attendantName: g.attendant_name || 'Todas as Atendentes',
            targetAmount: Number(g.target_amount) || 0,
            currentAmount: Number(g.current_amount) || 0,
            dueDate: g.due_date || new Date().toISOString().split('T')[0],
            createdAt: g.created_at || new Date().toISOString(),
            notes: g.notes || `Período: ${g.period || 'monthly'}`,
          }));
          setGoals(mappedGoals);
          if (!selectedGoalId && mappedGoals.length > 0) {
            setSelectedGoalId(mappedGoals[0].id);
          }
        }
      } catch (err) {
        console.warn('Supabase fetch fallback to local:', err);
      }
    }

    loadMetasFromSupabase();
  }, []);

  const activeGoal = useMemo(() => {
    return goals.find((g) => g.id === selectedGoalId) || goals[0] || null;
  }, [goals, selectedGoalId]);

  /**
   * CÁLCULO RIGOROSO DE METAS CONFORME DIRETRIZ DO CLIENTE:
   * "as metas devem estar bem enquadradas e subtraindo bem os valores já vendidos desde o momento
   * que se criou a meta e não antes daquela meta... antes de se criar a meta já se vendeu x,
   * esse x não deve ser subtraído na meta criada apenas agora".
   *
   * Regras:
   * 1. Apenas vendas com data e hora >= data e hora de criação da meta são elegíveis.
   * 2. Vendas canceladas são excluídas.
   * 3. Filtro de atendente se for uma meta individual.
   * 4. O saldo restante para bater a meta = Math.max(0, target - currentSold).
   */
  const getGoalMetrics = (goal: GoalItem) => {
    const goalCreatedTime = new Date(goal.createdAt).getTime();

    const eligibleSales = (sales || []).filter((s) => {
      if (s.status === 'canceled') return false;

      // Verificação temporal estrita: a venda precisa ter ocorrido a partir do momento em que a meta foi criada
      const saleTime = new Date(s.createdAt).getTime();
      if (!isNaN(saleTime) && !isNaN(goalCreatedTime)) {
        if (saleTime < goalCreatedTime) {
          return false; // Venda anterior à criação da meta NÃO é computada
        }
      }

      // Verificação de Atendente
      if (goal.attendantId && goal.attendantId !== 'TODOS') {
        const cashierName = (s.cashierName || '').trim().toLowerCase();
        const attendantName = (goal.attendantName || '').trim().toLowerCase();
        const matchName = cashierName && attendantName && (cashierName.includes(attendantName) || attendantName.includes(cashierName));
        if (!matchName) return false;
      }

      return true;
    });

    let currentSold = 0;
    if (goal.type === 'PROFIT') {
      currentSold = eligibleSales.reduce((acc, s) => {
        const saleProfit = (s.items || []).reduce((itemAcc, item) => {
          const cost = item.product?.costPrice !== undefined ? item.product.costPrice : (item.product?.salePrice || 0) * 0.7;
          const price = item.product?.salePrice || 0;
          return itemAcc + ((price - cost) * item.quantity);
        }, 0);
        return acc + saleProfit;
      }, 0);
    } else {
      // SALES ou BOTH: volume faturado em Kz
      currentSold = eligibleSales.reduce((acc, s) => acc + (s.total || 0), 0);
    }

    const target = goal.targetAmount;
    const remaining = Math.max(0, target - currentSold);
    const percentage = target > 0 ? Math.min(100, Math.round((currentSold / target) * 100)) : 0;
    const isCompleted = currentSold >= target;

    return {
      currentSold,
      target,
      remaining,
      percentage,
      isCompleted,
      salesCount: eligibleSales.length,
      eligibleSales,
      createdAtIso: goal.createdAt,
    };
  };

  const activeMetrics = useMemo(() => {
    if (!activeGoal) return null;
    return getGoalMetrics(activeGoal);
  }, [activeGoal, sales]);

  const currentBalance = activeMetrics ? (selectedDayInfo.isFuture ? 0 : activeMetrics.currentSold) : 0;
  const targetGoal = activeMetrics ? activeMetrics.target : 0;
  const toGoal = activeMetrics ? activeMetrics.remaining : 0;
  const percentage = activeMetrics ? activeMetrics.percentage : 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectDay = (day: CalendarDayItem) => {
    setSelectedDayKey(day.id);
    if (day.isFuture) {
      showToast(`Data futura selecionada (${day.fullFormatted}): Sem vendas registadas.`);
    } else if (day.isToday) {
      showToast('A exibir resultados de hoje.');
    } else {
      showToast(`A exibir dados de ${day.fullFormatted}.`);
    }
  };

  const handleGoToToday = () => {
    setWeekOffset(0);
    setSelectedDayKey(todayKey);
    showToast('Retornado para os dados de hoje.');
  };

  const handleGoalCreated = async (newGoalData: NewGoalDTO) => {
    const attendantObj = attendantOptions.find((a) => a.id === newGoalData.attendantId);
    const attendantName = newGoalData.attendantId === 'TODOS' 
      ? 'Todas as Atendentes' 
      : (attendantObj?.name || newGoalData.attendantId);

    // Conforme a regra do usuário: NENHUM valor inicial fixo ou prévio é atribuído.
    // O progresso inicia rigorosamente em 0 e só acumula vendas feitas a partir deste segundo.
    const nowIso = new Date().toISOString();

    const newGoal: GoalItem = {
      id: `goal-${Date.now()}`,
      title: newGoalData.title,
      type: newGoalData.type,
      attendantId: newGoalData.attendantId,
      attendantName,
      targetAmount: newGoalData.targetAmount,
      currentAmount: 0,
      dueDate: newGoalData.dueDate,
      createdAt: nowIso,
      notes: newGoalData.notes,
    };

    setGoals((prev) => {
      const updated = [newGoal, ...prev];
      try {
        localStorage.setItem('masakula_goals', JSON.stringify(updated));
        localStorage.removeItem('masakula_goals_cleared');
      } catch (e) {
        console.warn('Erro ao guardar meta no localStorage:', e);
      }
      return updated;
    });

    setSelectedGoalId(newGoal.id);
    showToast(`Meta "${newGoal.title}" criada com sucesso. Progresso calculado a partir de agora.`);

    try {
      await supabase.from('metas').insert([
        {
          title: newGoalData.title,
          target_amount: newGoalData.targetAmount,
          current_amount: 0,
          period: 'monthly',
          created_at: nowIso,
        },
      ]);
    } catch (err) {
      console.warn('Persistência em background no Supabase:', err);
    }
  };

  const handleDeleteGoal = async (goalId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setGoals((prev) => {
      const remaining = prev.filter((g) => g.id !== goalId);
      if (selectedGoalId === goalId) {
        setSelectedGoalId(remaining.length > 0 ? remaining[0].id : '');
      }
      try {
        localStorage.setItem('masakula_goals', JSON.stringify(remaining));
        if (remaining.length === 0) {
          localStorage.setItem('masakula_goals_cleared', 'true');
        }
      } catch (err) {
        console.warn('Erro ao persistir remoção de meta:', err);
      }
      return remaining;
    });

    showToast('Meta eliminada com sucesso.');

    try {
      if (!goalId.startsWith('goal-')) {
        await supabase.from('metas').delete().eq('id', goalId);
      }
    } catch (err) {
      console.warn('Erro ao remover no Supabase:', err);
    }
  };

  const handleClearAllGoals = async () => {
    setGoals([]);
    setSelectedGoalId('');
    try {
      localStorage.setItem('masakula_goals', JSON.stringify([]));
      localStorage.setItem('masakula_goals_cleared', 'true');
    } catch (e) {
      console.warn('Erro ao limpar metas no localStorage:', e);
    }
    showToast('Todas as metas foram eliminadas.');

    try {
      await supabase.from('metas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.warn('Erro ao limpar tabela metas no Supabase:', err);
    }
  };

  const filteredGoals = useMemo(() => {
    if (goalsFilter === 'ALL') return goals;
    return goals.filter((g) => {
      const gm = getGoalMetrics(g);
      if (goalsFilter === 'COMPLETED') {
        return gm.isCompleted;
      }
      return !gm.isCompleted;
    });
  }, [goals, goalsFilter, sales]);

  const revenueFormattedString = useMemo(() => {
    const formatted = formatKz(currentBalance);
    return formatted.replace(/\s*Kz$/, '');
  }, [currentBalance]);

  const avgDaily = useMemo(() => {
    if (!activeGoal) return 0;
    return Math.round(currentBalance / Math.max(1, selectedDayInfo.dayNumber));
  }, [activeGoal, currentBalance, selectedDayInfo.dayNumber]);

  return (
    <div id="view-goals" className="space-y-6 text-[#111111]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div role="status" className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 border border-zinc-800">
          <Check size={16} className="text-[#c8ff3d]" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. BARRA DE COMANDO ÚNICA: META EM FOCO, SEMANA E BOTÃO DE AÇÃO */}
      <section className="command">
        <label className="focus">
          <span>Meta em foco</span>
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
          >
            {goals.length === 0 ? (
              <option value="">Sem metas cadastradas</option>
            ) : (
              goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))
            )}
          </select>
        </label>

        {/* Semana com botões de dias */}
        <div className="week">
          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            title="Semana anterior"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft size={16} />
          </button>

          {calendarDays.map((day) => {
            const isSelected = day.id === selectedDayKey;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`day ${isSelected ? 'active' : ''}`}
                title={day.fullFormatted}
              >
                <span>{day.dayLabel}</span>
                <b>{day.dayNumber}</b>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            title="Próxima semana"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer ml-1"
          >
            <ChevronRight size={16} />
          </button>

          {(!selectedDayInfo.isToday || weekOffset !== 0) && (
            <button
              type="button"
              onClick={handleGoToToday}
              className="ml-2 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
              title="Voltar para hoje"
            >
              Hoje
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {goals.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllGoals}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Eliminar todas as metas e iniciar do zero"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Eliminar todas</span>
            </button>
          )}

          <button
            id="btn-new-goal"
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn"
          >
            <Plus size={15} />
            <span>Nova meta</span>
          </button>
        </div>
      </section>

      {/* 2. LAYOUT EM BENTO GRID: CARD ESCURO COM ANEL (2/3) + COLUNA DE INDICADORES (1/3) */}
      <section className="bento">
        {/* Card Escuro Principal (Hero) */}
        <article className="hero">
          <div className="hero-head">
            <div>
              <span className="tag">
                <i /> Meta · {activeGoal?.attendantName || 'Nenhuma meta ativa'}
              </span>
              <h2>
                {activeGoal ? (
                  activeGoal.title
                ) : (
                  <>
                    Nenhuma meta definida <small style={{ fontWeight: 300, color: '#888' }}>(Folha em branco)</small>
                  </>
                )}
              </h2>
            </div>

            {/* Anel de Progresso Conic Gradient com --p dinâmico */}
            <div className="ring" style={{ '--p': percentage } as React.CSSProperties}>
              <div>
                <span>
                  <strong>{percentage}%</strong>
                  <small>Realizado</small>
                </span>
              </div>
            </div>
          </div>

          {/* Faturado desde a criação da meta */}
          <div className="revenue">
            <small>Vendido desde a criação da meta</small>
            <div className="value">
              {revenueFormattedString} <span>Kz</span>
            </div>
          </div>

          {/* Linha de Progresso */}
          <div className="progress">
            <div className="bar">
              <i style={{ width: `${percentage}%` }}></i>
            </div>
            <div className="progress-meta">
              <span>
                {!activeGoal
                  ? 'Sem metas ativas no momento'
                  : selectedDayInfo.isFuture
                  ? 'Data futura: sem vendas registadas'
                  : toGoal === 0
                  ? 'Objetivo alcançado na totalidade!'
                  : `Faltam ${formatKz(toGoal)} para atingir a meta`}
              </span>
              <span>{percentage}% de 100%</span>
            </div>
          </div>

          {/* Linha de Enquadramento Rigoroso da Meta */}
          <div className="hero-strip">
            <div>
              <small>Meta Alvo Definida</small>
              <b>{formatKz(targetGoal)}</b>
            </div>
            <div>
              <small>Já Vendido (Pós-Criação)</small>
              <b className="text-[#c8ff3d]">{formatKz(currentBalance)}</b>
            </div>
            <div>
              <small>Falta para Bater Meta</small>
              <b>{formatKz(toGoal)}</b>
            </div>
          </div>

          {/* Banner de Transparência da Regra Operacional */}
          {activeGoal && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2.5 text-[11px] text-zinc-300">
              <ShieldCheck size={16} className="text-[#c8ff3d] shrink-0 mt-0.5" />
              <div>
                <span>
                  Regra ativa: Apenas vendas registadas a partir de{' '}
                  <strong className="text-white underline decoration-[#c8ff3d]">
                    {formatDateTime(activeGoal.createdAt)}
                  </strong>{' '}
                  são contabilizadas. Vendas anteriores foram desconsideradas.
                </span>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Total de vendas pós-criação contabilizadas: <strong>{activeMetrics?.salesCount || 0} faturas</strong> · Data limite: <strong>{activeGoal.dueDate}</strong>
                </div>
              </div>
            </div>
          )}
        </article>

        {/* Coluna Lateral de Indicadores Empilhados (Side) */}
        <aside className="side">
          <div className="kpi">
            <div className="ico">
              <TrendingUp size={20} className="text-neutral-700" />
            </div>
            <span>Média por dia</span>
            <strong>{formatKz(avgDaily)}</strong>
            <p>Com base no faturado pós-criação</p>
          </div>

          <div className="kpi">
            <div className="ico">
              <Flag size={20} className="text-neutral-700" />
            </div>
            <span>Falta para bater meta</span>
            <strong>{formatKz(activeGoal ? toGoal : 0)}</strong>
            <p>Diferencial exato para atingir 100% do plano</p>
          </div>

          <div className="kpi">
            <div className="ico">
              <Award size={20} className="text-neutral-700" />
            </div>
            <span>Vendas Elegíveis</span>
            <strong>{activeMetrics?.salesCount || 0} faturas</strong>
            <p>Emitidas após a criação da meta ativa</p>
          </div>
        </aside>
      </section>

      {/* 3. LISTA DE METAS COM CABEÇALHO, FILTROS E ESTADO VAZIO */}
      <section className="space-y-4">
        <div className="list-head">
          <div>
            <h3>Metas cadastradas e desempenho</h3>
            <p>Selecione uma meta para carregar o enquadramento detalhado no painel superior</p>
          </div>
          <div className="tabs">
            <button
              type="button"
              className={goalsFilter === 'ALL' ? 'on' : ''}
              onClick={() => setGoalsFilter('ALL')}
            >
              Todas ({goals.length})
            </button>
            <button
              type="button"
              className={goalsFilter === 'IN_PROGRESS' ? 'on' : ''}
              onClick={() => setGoalsFilter('IN_PROGRESS')}
            >
              Em andamento
            </button>
            <button
              type="button"
              className={goalsFilter === 'COMPLETED' ? 'on' : ''}
              onClick={() => setGoalsFilter('COMPLETED')}
            >
              Concluídas
            </button>
          </div>
        </div>

        {filteredGoals.length === 0 ? (
          <div className="empty" style={{ marginTop: '16px' }}>
            <div className="target"></div>
            <h4>Nenhuma meta cadastrada (Folha em branco)</h4>
            <p>Crie uma nova meta comercial para monitorizar o desempenho da equipa.</p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn"
            >
              <Plus size={15} />
              <span>Criar primeira meta</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {filteredGoals.map((goal) => {
              const gm = getGoalMetrics(goal);
              const isSelected = goal.id === selectedGoalId;
              const displayAmount = selectedDayInfo.isFuture ? 0 : gm.currentSold;
              const goalPct = gm.percentage;
              const isDone = gm.isCompleted;
              const remaining = gm.remaining;

              return (
                <div
                  key={goal.id}
                  onClick={() => {
                    setSelectedGoalId(goal.id);
                    showToast(`Meta "${goal.title}" focada no painel.`);
                  }}
                  className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer shadow-xs hover:shadow-md ${
                    isSelected
                      ? 'border-[#111111] ring-2 ring-[#111111]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        {goal.type === 'SALES' ? 'Vendas' : goal.type === 'PROFIT' ? 'Lucro' : 'Geral'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteGoal(goal.id, e)}
                        title="Eliminar meta"
                        className="text-neutral-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-neutral-900 leading-snug line-clamp-1">
                        {goal.title}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5 truncate">
                        {goal.attendantName}
                      </p>
                    </div>

                    {/* Bloco de Progresso com Valores Enquadrados */}
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-extrabold text-neutral-950" data-numeric="true">
                          {formatKz(displayAmount)}
                        </span>
                        <span className="font-bold text-neutral-500" data-numeric="true">
                          {goalPct}%
                        </span>
                      </div>

                      {/* Barra Sólida em #111 com acento de conclusão */}
                      <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-600' : 'bg-neutral-900'}`}
                          style={{ width: `${goalPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-0.5">
                        <span data-numeric="true">Meta: {formatKz(goal.targetAmount)}</span>
                        <span>{goal.dueDate}</span>
                      </div>

                      <div className="text-[10px] text-zinc-400 bg-zinc-50 px-2 py-1 rounded-md flex items-center gap-1">
                        <Clock size={11} className="text-zinc-500 shrink-0" />
                        <span className="truncate">Criada em: {formatDate(goal.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-neutral-500">
                      {isSelected ? 'Em foco' : 'Clique para focar'}
                    </span>
                    {isDone ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Concluída
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-neutral-700" data-numeric="true">
                        Faltam {formatKz(remaining)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Criação de Meta */}
      {isModalOpen && (
        <CreateGoalModal
          attendants={attendantOptions}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleGoalCreated}
        />
      )}
    </div>
  );
};

export const GoalsView: React.FC<GoalsDashboardProps & { initialTab?: string }> = ({
  initialTab,
  sales = [],
  products = [],
}) => {
  if (initialTab === 'attendance') {
    return (
      <div id="view-attendance" className="workspace-view">
        <AttendanceStatsModule />
      </div>
    );
  }

  return <GoalsDashboardView sales={sales} products={products} />;
};

export default GoalsView;
