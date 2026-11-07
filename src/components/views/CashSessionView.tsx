import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Receipt,
  RotateCcw,
  Clock,
  User,
  Check,
  Coins,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Wallet
} from 'lucide-react';
import { CashSession, CashMovement } from '../../types';
import { formatKz, formatDate, formatTime } from '../../utils/formatters';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';

interface CashSessionViewProps {
  activeSession: CashSession | null;
  setActiveSession: React.Dispatch<React.SetStateAction<CashSession | null>>;
  movements: CashMovement[];
  setMovements: React.Dispatch<React.SetStateAction<CashMovement[]>>;
}

export const CashSessionView: React.FC<CashSessionViewProps> = ({
  activeSession,
  setActiveSession,
  movements,
  setMovements
}) => {
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Formulário de Abertura
  const [initialAmountInput, setInitialAmountInput] = useState<number>(50000);
  const [operatorInput, setOperatorInput] = useState<string>('Operador Principal (Masakula)');

  // Fechamento & Conferência
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [actualCashInput, setActualCashInput] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>('');

  // Movimentação Avulsa (Sangria / Suprimento)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'SUPRIMENTO' | 'SANGRIA'>('SANGRIA');
  const [movementAmount, setMovementAmount] = useState<number>(5000);
  const [movementReason, setMovementReason] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const syncActiveSession = async () => {
    setLoading(true);
    try {
      const res = await supabaseService.getActiveCashSession();
      if (res.fromSupabase) {
        setActiveSession(res.data);
        if (res.data?.id) {
          const movs = await supabaseService.getCashMovements(res.data.id);
          if (movs.fromSupabase) {
            setMovements(movs.data);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao sincronizar sessão de caixa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeSession) {
      syncActiveSession();
    } else {
      setActualCashInput(activeSession.expected_cash || 0);
    }
  }, []);

  // 1. Abertura de Caixa
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialAmountInput < 0) {
      showToast('O fundo de caixa não pode ser negativo.');
      return;
    }

    setLoading(true);
    const newSession: CashSession = {
      id: `cs-${Date.now()}`,
      operator_name: operatorInput.trim() || 'Operador Balcão',
      initial_amount: Number(initialAmountInput),
      expected_cash: Number(initialAmountInput),
      status: 'OPEN',
      opened_at: new Date().toISOString(),
      actual_cash: null,
      difference: null,
      notes: null,
    };

    setActiveSession(newSession);
    setMovements([]);
    showToast(`Caixa aberto com fundo inicial de ${formatKz(newSession.initial_amount)}.`);

    try {
      const created = await supabaseService.openCashSession({
        operator_name: newSession.operator_name,
        initial_amount: newSession.initial_amount,
      });
      if (created && created.id) {
        setActiveSession(created);
      }
    } catch (err) {
      console.warn('Erro ao salvar no Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Lançar Sangria ou Suprimento
  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    if (movementAmount <= 0) {
      showToast('Por favor, informe um valor maior que zero.');
      return;
    }
    if (!movementReason.trim()) {
      showToast('Por favor, justifique o motivo da movimentação.');
      return;
    }

    // Validação de Sangria: não permitir sangria maior que o saldo esperado atual
    if (movementType === 'SANGRIA' && movementAmount > activeSession.expected_cash) {
      const confirmOverride = window.confirm(
        `Atenção: A sangria de ${formatKz(movementAmount)} é maior que o saldo esperado de ${formatKz(activeSession.expected_cash)}. Deseja continuar mesmo assim?`
      );
      if (!confirmOverride) return;
    }

    const adjustment = movementType === 'SUPRIMENTO' ? Number(movementAmount) : -Number(movementAmount);
    const newExpected = Math.max(0, Number(activeSession.expected_cash) + adjustment);

    const newMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      session_id: activeSession.id,
      type: movementType,
      amount: Number(movementAmount),
      reason: movementReason.trim(),
      created_at: new Date().toISOString()
    };

    const updatedSession: CashSession = {
      ...activeSession,
      expected_cash: newExpected
    };

    setActiveSession(updatedSession);
    setMovements(prev => [newMovement, ...prev]);
    showToast(
      movementType === 'SUPRIMENTO' 
        ? `Suprimento de +${formatKz(movementAmount)} adicionado ao caixa.` 
        : `Sangria de -${formatKz(movementAmount)} registrada com sucesso.`
    );

    setIsMovementModalOpen(false);
    setMovementAmount(5000);
    setMovementReason('');

    // Sincronização assíncrona
    supabaseService.insertCashMovement(newMovement).catch(err => console.warn(err));
    supabaseService.updateCashSessionExpected(activeSession.id, newExpected).catch(err => console.warn(err));
  };

  // 3. Fechamento de Caixa & Apuração de Quebra / Sobra
  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    const counted = Number(actualCashInput) || 0;
    const expected = Number(activeSession.expected_cash) || 0;
    const diff = counted - expected; // Positivo = Sobra, Negativo = Quebra, Zero = Exato

    const closedSession: CashSession = {
      ...activeSession,
      actual_cash: counted,
      difference: diff,
      status: 'CLOSED',
      closed_at: new Date().toISOString(),
      notes: closingNotes || null
    };

    setActiveSession(null);
    setMovements([]);
    setIsClosingModalOpen(false);

    let statusText = 'Caixa balanceado exato!';
    if (diff > 0) statusText = `Fechamento concluído com SOBRA de +${formatKz(diff)}.`;
    if (diff < 0) statusText = `Fechamento concluído com QUEBRA de -${formatKz(Math.abs(diff))}.`;
    showToast(statusText);

    supabaseService.closeCashSession(activeSession.id, counted, diff).catch(err => console.warn(err));
  };

  // Totais de movimentações
  const totalSuprimentos = movements
    .filter(m => m.type === 'SUPRIMENTO')
    .reduce((acc, m) => acc + Number(m.amount), 0);

  const totalSangrias = movements
    .filter(m => m.type === 'SANGRIA')
    .reduce((acc, m) => acc + Number(m.amount), 0);
  return (
    <div id="view-cash-session" className="workspace-view space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-zinc-950">
      {/* Toast Feedback */}
      {toastMessage && (
        <div role="status" className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-3">
          <Check size={16} className="text-emerald-400" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==========================================
          ESTADO 1: CAIXA FECHADO (Formulário de Abertura)
          ========================================== */}
      {!activeSession ? (
        <div className="workspace-panel max-w-md mx-auto my-10 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-zinc-100 text-zinc-800 rounded-2xl flex items-center justify-center mx-auto">
              <Lock size={30} />
            </div>
            <h2 className="text-xl font-black text-zinc-950">Caixa Fechado</h2>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Inicie uma nova sessão de PDV informando o operador e o fundo de caixa de reserva em Kwanzas (Kz).
            </p>
          </div>

          <form onSubmit={handleOpenSession} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-700 block mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-zinc-400" />
                Nome do Operador de Caixa *
              </label>
              <input
                id="input-operator-name"
                type="text"
                required
                value={operatorInput}
                onChange={(e) => setOperatorInput(e.target.value)}
                placeholder="Ex: Operador Principal / Caixa 01"
                className="workspace-control w-full"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 block mb-1.5 flex items-center gap-1.5">
                <Coins size={14} className="text-zinc-400" />
                Fundo de Caixa Inicial (Kz) *
              </label>
              <input
                id="input-initial-amount"
                type="number"
                required
                min="0"
                step="100"
                value={initialAmountInput || ''}
                onChange={(e) => setInitialAmountInput(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 50.000 Kz"
                className="workspace-control w-full text-base font-semibold"
              />
              <p className="text-[11px] text-zinc-400 mt-1 font-medium">
                Valor físico em dinheiro vivo deixado na gaveta para troco.
              </p>
            </div>

            <div className="pt-2">
              <button
                id="btn-open-cash-session"
                type="submit"
                disabled={loading}
                className="workspace-primary-action w-full cursor-pointer"
              >
                <Unlock size={16} />
                <span>{loading ? 'A abrir caixa...' : 'Abrir Sessão de Caixa'}</span>
              </button>
            </div>
          </form>

          <div className="border-t border-gray-100 pt-4 text-center">
            <span className="text-[11px] text-zinc-400 font-medium">
              Ecossistema Masakula • Faturação e Vendas em conformidade AGT
            </span>
          </div>
        </div>
      ) : (
        /* ==========================================
           ESTADO 2: CAIXA ABERTO (Painel Operacional)
           ========================================== */
        <div className="space-y-6">
          {/* Barra de Contexto Silenciosa e Hierarquia de Ações (Secção 13.2 A) */}
          <div className="bg-white border border-[var(--line)] rounded-[var(--radius-card)] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
              <div>
                <span className="text-zinc-500">Estado: </span>
                <span className="font-semibold text-[#0b7a54]">Caixa aberta</span>
              </div>
              <span className="text-zinc-300" aria-hidden="true">|</span>
              <div>
                <span className="text-zinc-500">Operador: </span>
                <strong className="font-semibold text-[#111111]">{activeSession.operator_name}</strong>
              </div>
              <span className="text-zinc-300" aria-hidden="true">|</span>
              <div>
                <span className="text-zinc-500">Abertura: </span>
                <span className="font-medium text-[#111111]" data-numeric="true">
                  {formatDate(activeSession.opened_at)} às {formatTime(activeSession.opened_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                id="btn-trigger-movement"
                type="button"
                onClick={() => setIsMovementModalOpen(true)}
                className="btn--secondary flex-1 md:flex-none cursor-pointer"
              >
                <span>Registar sangria ou suprimento</span>
              </button>
              <button
                id="btn-trigger-close"
                type="button"
                onClick={() => {
                  setActualCashInput(activeSession.expected_cash || 0);
                  setIsClosingModalOpen(true);
                }}
                className="btn--primary flex-1 md:flex-none cursor-pointer"
              >
                <span>Fechar caixa</span>
              </button>
            </div>
          </div>

          {/* Grelha de 4 KPIs e Invariante Contábil da Gaveta (Secção 13.2 B) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="kpi">
              <span className="kpi__label">Fundo inicial</span>
              <strong className="kpi__value" data-numeric="true">
                {formatKz(activeSession.initial_amount)}
              </strong>
              <span className="kpi__meta">Abertura às {formatTime(activeSession.opened_at)}</span>
            </div>

            <div className="kpi">
              <span className="kpi__label">Suprimentos</span>
              <strong className="kpi__value" data-numeric="true">
                +{formatKz(totalSuprimentos)}
              </strong>
              <span className="kpi__meta">Entradas de reforço na sessão</span>
            </div>

            <div className="kpi">
              <span className="kpi__label">Sangrias</span>
              <strong className="kpi__value" data-numeric="true">
                -{formatKz(totalSangrias)}
              </strong>
              <span className="kpi__meta">Recolhas para cofre na sessão</span>
            </div>

            <div className="kpi kpi--featured">
              <span className="kpi__label">Saldo esperado em gaveta</span>
              <strong className="kpi__value" data-numeric="true">
                {formatKz(activeSession.expected_cash)}
              </strong>
              <span className="kpi__meta">Fundo inicial + Suprimentos - Sangrias</span>
            </div>
          </div>

          {/* Tabela de Movimentações Avulsas de Alta Densidade (Secção 13.2 C) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#111111]">Movimentações avulsas de caixa</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Histórico de saídas (sangrias) e entradas de reforço (suprimentos)</p>
              </div>
              <span className="text-xs font-semibold text-[var(--text-secondary)]" data-numeric="true">
                {movements.length === 1 ? '1 registo' : `${movements.length} registos`}
              </span>
            </div>

            {movements.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm font-medium bg-white border border-[var(--line)] rounded-[var(--radius-card)]">
                <p className="text-sm font-semibold text-[#111111]">Nenhuma sangria ou suprimento registado nesta sessão</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Utilize o botão acima para lançar entradas ou saídas de troco.</p>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>Tipo</th>
                      <th>Motivo / Descrição</th>
                      <th style={{ width: '180px' }}>Data e hora</th>
                      <th className="col-numeric" style={{ width: '150px' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => {
                      const isSuprimento = m.type === 'SUPRIMENTO';
                      return (
                        <tr key={m.id || Math.random().toString()}>
                          <td>
                            <span className="badge">
                              {isSuprimento ? 'Suprimento' : 'Sangria'}
                            </span>
                          </td>
                          <td className="font-medium text-[#111111]">
                            {m.reason}
                          </td>
                          <td className="text-[var(--text-secondary)] text-xs" data-numeric="true">
                            {formatDate(m.created_at || '')} às {formatTime(m.created_at || '')}
                          </td>
                          <td className="col-numeric">
                            {isSuprimento ? `+ ${formatKz(m.amount)}` : `- ${formatKz(m.amount)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: SANGRIA / SUPRIMENTO
          ========================================== */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="workspace-panel max-w-md w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-zinc-950">Registrar Movimentação de Gaveta</h3>
              <button 
                type="button" 
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMovement} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1.5">Tipo de Movimento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('SANGRIA')}
                    className={`py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      movementType === 'SANGRIA' 
                        ? 'bg-[var(--ink)] text-white' 
                        : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    <span>Sangria (Retirada)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('SUPRIMENTO')}
                    className={`py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      movementType === 'SUPRIMENTO' 
                        ? 'bg-[var(--ink)] text-white' 
                        : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    <span>Suprimento (Entrada)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Valor em Kwanzas (Kz) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="50"
                  value={movementAmount || ''}
                  onChange={(e) => setMovementAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Motivo / Justificativa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pagamento a fornecedor / Fundo suplementar de trocos"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="btn--secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn--primary"
                >
                  Confirmar movimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: FECHAMENTO DE CAIXA & CONFERÊNCIA
          ========================================== */}
      {isClosingModalOpen && activeSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[var(--radius-card)] border border-[var(--line)] max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#111111]">Fechamento e conferência de caixa</h3>
                <p className="text-xs text-[var(--text-secondary)]">Apuramento de saldos da sessão em Kwanzas (Kz)</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsClosingModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-4 text-xs">
              <div className="bg-zinc-50 p-4 rounded-xl space-y-2 border border-[var(--line)]">
                <div className="flex justify-between font-medium text-zinc-500">
                  <span>Fundo inicial:</span>
                  <span className="font-bold text-[#111111]" data-numeric="true">{formatKz(activeSession.initial_amount)}</span>
                </div>
                <div className="flex justify-between font-medium text-zinc-500">
                  <span>Total de suprimentos:</span>
                  <span className="font-bold text-[#111111]" data-numeric="true">+{formatKz(totalSuprimentos)}</span>
                </div>
                <div className="flex justify-between font-medium text-zinc-500">
                  <span>Total de sangrias:</span>
                  <span className="font-bold text-[#111111]" data-numeric="true">-{formatKz(totalSangrias)}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-700 pt-2 border-t border-[var(--line)]">
                  <span>Saldo esperado em gaveta:</span>
                  <span className="font-black text-[#111111] text-sm" data-numeric="true">{formatKz(activeSession.expected_cash)}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">
                  Valor fisicamente contado em dinheiro (Kz) *
                </label>
                <input
                  type="number"
                  required
                  step="50"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(parseFloat(e.target.value) || 0)}
                  placeholder="0,00 Kz"
                  className="w-full p-3 bg-zinc-50 border border-[var(--line)] rounded-xl text-base font-bold text-[#111111] focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  data-numeric="true"
                />
              </div>

              {/* Cálculo dinâmico de diferença: Sobra / Quebra / Exato */}
              {(() => {
                const diff = actualCashInput - activeSession.expected_cash;
                if (diff === 0) {
                  return (
                    <div className="p-3 bg-[var(--success-soft)] border border-transparent text-[var(--success-text)] rounded-xl font-semibold flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>Caixa balanceado exato. Sem divergências entre a contagem física e o sistema.</span>
                    </div>
                  );
                } else if (diff < 0) {
                  return (
                    <div className="p-3 bg-[var(--danger-soft)] border border-transparent text-[var(--danger-text)] rounded-xl font-semibold flex items-center gap-2">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>Quebra de caixa: Faltam {formatKz(Math.abs(diff))} na gaveta.</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3 bg-[var(--warning-soft)] border border-transparent text-[var(--warning-text)] rounded-xl font-semibold flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>Sobra de caixa: Excedente de +{formatKz(diff)} na gaveta.</span>
                    </div>
                  );
                }
              })()}

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Observações de encerramento (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Justificativa de quebra/sobra ou notas de fecho..."
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-[var(--line)] rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(false)}
                  className="btn--secondary"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className={actualCashInput < activeSession.expected_cash ? 'btn--danger' : 'btn--primary'}
                >
                  {actualCashInput < activeSession.expected_cash ? 'Encerrar com quebra' : 'Confirmar encerramento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CashSessionView;
