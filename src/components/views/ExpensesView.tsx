import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  ChevronDown,
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  ArrowUpRight,
  TrendingDown,
  Building2,
  Wallet,
  Receipt,
  FileSpreadsheet,
  Check,
  RotateCcw,
  Sparkles,
  Camera
} from 'lucide-react';
import { Expense } from '../../types';
import { formatKz, formatDate } from '../../utils/formatters';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';
import { RoleGuard } from '../RoleGuard';
import { ConfirmModal } from '../ui/ConfirmModal';
import { toast } from 'sonner';
import { useTrash } from '../../contexts/TrashContext';
import { InlinePageUndoBanner } from '../ui/InlinePageUndoBanner';
import { OfflinePhotoAttachment } from '../ui/OfflinePhotoAttachment';

interface ExpensesViewProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  setExpenses,
}) => {
  return (
    <RoleGuard allowedRoles={['GERENTE']}>
      <ExpensesContent expenses={expenses} setExpenses={setExpenses} />
    </RoleGuard>
  );
};

const ExpensesContent: React.FC<ExpensesViewProps> = ({
  expenses,
  setExpenses,
}) => {
  const { trash } = useTrash();
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; description: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [receiptLightboxUrl, setReceiptLightboxUrl] = useState<string | null>(null);

  // Formulário State
  const [formData, setFormData] = useState<Expense>({
    description: '',
    category: 'Operacional',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    supplier: '',
    payment_method: 'Multicaixa',
    notes: '',
    receiptPhoto: ''
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchExpensesFromSupabase = async () => {
    setLoading(true);
    try {
      const res = await supabaseService.getExpenses();
      if (res.fromSupabase && res.data.length > 0) {
        setExpenses(res.data);
      }
    } catch (err) {
      console.warn('Supabase fetch expenses error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesFromSupabase();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.amount <= 0) {
      showToast('Por favor, informe a descrição e um valor válido.');
      return;
    }

    if (editingExpense?.id) {
      const updated: Expense = {
        ...editingExpense,
        ...formData,
      };

      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? updated : exp));
      showToast(`Despesa "${formData.description}" atualizada com sucesso.`);
      
      // Async Supabase update
      supabaseService.updateExpense(editingExpense.id, formData).catch(err => console.warn(err));
    } else {
      const newExpense: Expense = {
        ...formData,
        id: `exp-${Date.now()}`,
      };

      setExpenses(prev => [newExpense, ...prev]);
      showToast(`Nova despesa "${newExpense.description}" registrada.`);

      // Async Supabase insert
      supabaseService.insertExpense(newExpense).catch(err => console.warn(err));
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleTogglePaid = async (expense: Expense) => {
    const isCurrentlyPaid = expense.status === 'PAID';
    const newStatus = isCurrentlyPaid ? 'PENDING' : 'PAID';
    const paymentDate = newStatus === 'PAID' ? new Date().toISOString().split('T')[0] : null;

    const updatedExpense: Expense = {
      ...expense,
      status: newStatus,
      payment_date: paymentDate
    };

    setExpenses(prev => prev.map(exp => exp.id === expense.id ? updatedExpense : exp));
    showToast(newStatus === 'PAID' ? `Despesa marcada como PAGA.` : `Despesa marcada como PENDENTE.`);

    if (expense.id) {
      supabaseService.updateExpense(expense.id, {
        status: newStatus,
        payment_date: paymentDate
      }).catch(err => console.warn(err));
    }
  };

  const handleDelete = (id: string, description: string) => {
    setExpenseToDelete({ id, description });
  };

  const confirmDeleteExpense = (e?: React.MouseEvent) => {
    if (!expenseToDelete) return;
    const { id, description } = expenseToDelete;
    const targetExp = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));

    if (targetExp) {
      trash({
        id: targetExp.id || id,
        name: targetExp.description,
        type: 'expense',
        typeLabel: 'Despesa',
        data: targetExp,
        onRestore: (restored: Expense) => {
          setExpenses((prev) => [restored, ...prev]);
          supabaseService.insertExpense(restored).catch((err) => console.warn(err));
        },
        onPermanentDelete: (exp: Expense) => {
          if (exp.id) {
            supabaseService.deleteExpense(exp.id).catch((err) => console.warn(err));
          }
        },
      }, e ? { clientX: e.clientX, clientY: e.clientY } : undefined);
    }

    toast.success(`Despesa "${description}" movida para a lixeira.`);
    setExpenseToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      description: '',
      category: 'Operacional',
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      supplier: '',
      payment_method: 'Multicaixa',
      notes: '',
      receiptPhoto: ''
    });
    setEditingExpense(null);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      category: expense.category || 'Operacional',
      amount: expense.amount || 0,
      due_date: expense.due_date || new Date().toISOString().split('T')[0],
      payment_date: expense.payment_date || null,
      status: expense.status || 'PENDING',
      supplier: expense.supplier || '',
      payment_method: expense.payment_method || 'Multicaixa',
      notes: expense.notes || '',
      receiptPhoto: expense.receiptPhoto || ''
    });
    setIsModalOpen(true);
  };

  // Cálculos de Indicadores
  const indicators = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let overdue = 0;
    let total = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    expenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      total += amt;

      if (exp.status === 'PAID') {
        paid += amt;
      } else if (exp.status === 'OVERDUE' || (exp.status === 'PENDING' && exp.due_date < todayStr)) {
        overdue += amt;
      } else {
        pending += amt;
      }
    });

    return {
      totalPaid: paid,
      totalPending: pending,
      totalOverdue: overdue,
      totalAmount: total,
    };
  }, [expenses]);

  // Filtragem Reativa
  const filteredExpenses = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return expenses.filter(exp => {
      const matchesSearch = 
        !term ||
        exp.description.toLowerCase().includes(term) || 
        (exp.supplier && exp.supplier.toLowerCase().includes(term)) ||
        (exp.notes && exp.notes.toLowerCase().includes(term)) ||
        (exp.payment_method && exp.payment_method.toLowerCase().includes(term));
      
      const matchesStatus = filterStatus === 'ALL' || exp.status === filterStatus;
      const matchesCategory = filterCategory === 'ALL' || exp.category === filterCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [expenses, searchTerm, filterStatus, filterCategory]);
  const expenseInsights = useMemo(() => {
    const categoryTotals = expenses.reduce<Record<string, number>>((totals, expense) => {
      const category = expense.category || 'Outros';
      totals[category] = (totals[category] || 0) + (Number(expense.amount) || 0);
      return totals;
    }, {});
    const topCategory = Object.entries(categoryTotals).sort(([, first], [, second]) => second - first)[0];
    return {
      topCategory: topCategory?.[0] || 'Sem dados',
      recurring: expenses.filter((expense) => Boolean((expense as Expense & { recurring?: boolean }).recurring)).length,
      average: expenses.length ? indicators.totalAmount / expenses.length : 0,
    };
  }, [expenses, indicators.totalAmount]);

  return (
    <div id="view-expenses" className="workspace-view space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-zinc-950">
      {/* BANNER DE UNDO NA PRÓPRIA PÁGINA */}
      <InlinePageUndoBanner pageType="expense" />
      {/* Toast Feedback */}
      {toastMessage && (
        <div role="status" className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-3">
          <Check size={16} className="text-emerald-400" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          id="btn-new-expense"
          type="button"
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn--primary"
        >
          <span>Registar despesa</span>
        </button>
      </div>

      {/* 2. KPIS FINANCEIROS CANÓNICOS (Secção 13.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pago */}
        <div className="kpi">
          <span className="kpi__label">Total pago</span>
          <strong className="kpi__value" data-numeric="true">{formatKz(indicators.totalPaid)}</strong>
          <span className="kpi__meta">Despesas liquidadas no período</span>
        </div>

        {/* A Pagar (Pendente) */}
        <div className="kpi">
          <span className="kpi__label">A pagar (Pendente)</span>
          <strong className="kpi__value" data-numeric="true">{formatKz(indicators.totalPending)}</strong>
          <span className="kpi__meta">Compromissos a liquidar</span>
        </div>

        {/* Atrasadas */}
        <div className="kpi">
          <span className="kpi__label">Em atraso</span>
          <strong className="kpi__value" data-numeric="true">{formatKz(indicators.totalOverdue)}</strong>
          <span className="kpi__meta">Vencimentos ultrapassados</span>
        </div>
      </div>

      <details className="group rounded-xl border border-zinc-200 bg-white">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-zinc-700 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500">
          <span>Mais indicadores</span>
          <ChevronDown size={16} aria-hidden="true" className="text-zinc-500 transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-1 gap-3 border-t border-zinc-200 p-3 md:grid-cols-3">
          <div className="workspace-panel-muted p-4">
            <p className="text-sm font-medium text-zinc-600">Total lançado</p>
            <p className="mt-1 text-lg font-bold text-zinc-950">{formatKz(indicators.totalAmount)}</p>
            <p className="mt-1 text-xs text-zinc-600">Média de {formatKz(expenseInsights.average)} por lançamento</p>
          </div>
          <div className="workspace-panel-muted p-4">
            <p className="text-sm font-medium text-zinc-600">Maior categoria</p>
            <p className="mt-1 text-lg font-bold text-zinc-950">{expenseInsights.topCategory}</p>
          </div>
          <div className="workspace-panel-muted p-4">
            <p className="text-sm font-medium text-zinc-600">Recorrentes</p>
            <p className="mt-1 text-lg font-bold text-zinc-950">{expenseInsights.recurring}</p>
          </div>
        </div>
      </details>

      {/* 3. BARRA DE BUSCA E FILTROS */}
      <div className="workspace-toolbar flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="search-expenses"
            type="text"
            placeholder="Buscar por descrição, fornecedor ou nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="workspace-control w-full pl-10 pr-9"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            id="filter-status-expense"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="workspace-control cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PAID">Pagas</option>
            <option value="PENDING">Pendentes</option>
            <option value="OVERDUE">Atrasadas</option>
          </select>

          <select
            id="filter-category-expense"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="workspace-control cursor-pointer"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="Operacional">Operacional</option>
            <option value="Fornecedores">Fornecedores</option>
            <option value="Salários">Salários</option>
            <option value="Impostos">Impostos</option>
            <option value="Utilidades">Água / Luz / Internet</option>
            <option value="Outros">Outros</option>
          </select>

          {(searchTerm || filterStatus !== 'ALL' || filterCategory !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('ALL');
                setFilterCategory('ALL');
              }}
              title="Limpar Filtros"
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 4. TABELA DE LANÇAMENTOS */}
      <div className="workspace-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="workspace-table-head border-b border-zinc-200 text-xs font-semibold">
                <th className="py-3.5 px-4">Descrição / Fornecedor</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Vencimento</th>
                <th className="py-3.5 px-4">Valor (Kz)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-400 font-medium">
                    A carregar despesas...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-400 font-medium">
                    <Receipt className="mx-auto mb-2 text-zinc-300" size={32} />
                    <p>Nenhuma despesa encontrada para os critérios selecionados.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const isPaid = expense.status === 'PAID';
                  const isOverdue = expense.status === 'OVERDUE';

                  return (
                    <tr key={expense.id || Math.random().toString()} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-zinc-950">{expense.description}</p>
                          {expense.receiptPhoto && (
                            <button
                              type="button"
                              onClick={() => setReceiptLightboxUrl(expense.receiptPhoto || null)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                              title="Visualizar foto do recibo/fatura"
                            >
                              <Camera size={11} className="text-emerald-600" />
                              <span>Recibo</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium">
                          {expense.supplier || 'Sem fornecedor especificado'}
                          {expense.notes && ` • ${expense.notes}`}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-zinc-100 text-zinc-700 text-[10px] font-bold px-2.5 py-1 rounded-xl">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-600">
                        {formatDate(expense.due_date)}
                        {expense.payment_date && isPaid && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Pago em {formatDate(expense.payment_date)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-black text-zinc-950">
                        {formatKz(expense.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePaid(expense)}
                          aria-pressed={isPaid}
                          aria-label={`Marcar despesa ${expense.description} como ${isPaid ? 'pendente' : 'paga'}`}
                          title="Clique para alternar o estado de pagamento"
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide inline-flex items-center gap-1 transition cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 size={11} />
                              <span>PAGO</span>
                            </>
                          ) : isOverdue ? (
                            <>
                              <AlertCircle size={11} />
                              <span>ATRASADO</span>
                            </>
                          ) : (
                            <>
                              <Clock size={11} />
                              <span>PENDENTE</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(expense)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                          title="Editar Despesa"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => expense.id && handleDelete(expense.id, expense.description)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Eliminar Despesa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="workspace-panel max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800">
                  <TrendingDown size={18} aria-hidden="true" />
                </div>
                <h3 className="font-bold text-base text-zinc-950">
                  {editingExpense ? 'Editar Despesa' : 'Lançar Nova Despesa'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Descrição do Custo / Despesa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Renda do Estabelecimento, Conta de Luz..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Valor em Kwanzas (Kz) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0 Kz"
                    className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
                  >
                    <option value="Operacional">Operacional</option>
                    <option value="Fornecedores">Fornecedores</option>
                    <option value="Salários">Salários</option>
                    <option value="Impostos">Impostos</option>
                    <option value="Utilidades">Água / Luz / Internet</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Status Inicial</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                    <option value="OVERDUE">Atrasado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Fornecedor / Beneficiário</label>
                  <input
                    type="text"
                    placeholder="Ex: ENDE / EPAL / Distribuidor"
                    value={formData.supplier || ''}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Forma de Pagamento</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
                  >
                    <option value="Multicaixa">TPA / Multicaixa</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Dinheiro">Dinheiro (Cash)</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Observações ou Detalhes</label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais, número de factura ou comprovativo..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 resize-none"
                />
              </div>

              {/* Anexo de Foto do Comprovativo / Fatura (Offline) */}
              <div className="p-3 bg-zinc-50 rounded-2xl border border-gray-200">
                <OfflinePhotoAttachment
                  photos={formData.receiptPhoto ? [formData.receiptPhoto] : []}
                  onChange={(photos) => setFormData({ ...formData, receiptPhoto: photos[0] || '' })}
                  maxPhotos={1}
                  label="Comprovativo / Fatura em Papel (Foto Offline)"
                  helperText="Fotografe o recibo ou fatura do fornecedor com a câmara do aparelho ou carregue a imagem"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="workspace-primary-action px-5 cursor-pointer"
                >
                  <Check size={14} className="text-emerald-400" aria-hidden="true" />
                  <span>Salvar Despesa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox para Foto do Comprovativo */}
      {receiptLightboxUrl && (
        <div 
          onClick={() => setReceiptLightboxUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800">
              <span className="text-xs font-mono text-zinc-300 font-bold">Comprovativo da Despesa (Offline)</span>
              <button
                type="button"
                onClick={() => setReceiptLightboxUrl(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black">
              <img
                src={receiptLightboxUrl}
                alt="Foto do Comprovativo"
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Despesa */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        title="Eliminar Despesa"
        description={`Tem a certeza de que deseja eliminar o lançamento da despesa "${expenseToDelete?.description}"?`}
        confirmText="Sim, Eliminar Despesa"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteExpense}
        onClose={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
export default ExpensesView;
