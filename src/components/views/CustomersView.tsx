import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Edit, 
  Trash2, 
  X,
  Building,
  UserCheck,
  Receipt,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import { Customer, SaleTransaction } from '../../types';
import { formatKz, formatDate, formatDateTime } from '../../utils/formatters';
import { ConfirmModal } from '../ui/ConfirmModal';
import { toast } from 'sonner';
import { useTrash } from '../../contexts/TrashContext';
import { InlinePageUndoBanner } from '../ui/InlinePageUndoBanner';

interface CustomersViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  sales?: SaleTransaction[];
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  setCustomers,
  sales = [],
}) => {
  const { trash } = useTrash();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    nifOrBi: '',
    email: '',
    phone: '+244 9',
    city: 'Luanda',
  });

  // Calculate live dynamic purchases and total spent for any customer
  const getCustomerMetrics = (c: Customer) => {
    const targetName = c.name?.trim().toLowerCase();
    const targetNif = c.nifOrBi?.trim().toLowerCase();

    const matchingSales = (sales || []).filter(s => {
      if (s.status === 'canceled') return false;
      const matchName = targetName && s.customerName && s.customerName.trim().toLowerCase() === targetName;
      const matchNif = targetNif && s.customerNif && s.customerNif.trim().toLowerCase() === targetNif;
      return matchName || matchNif;
    });

    const salesCount = matchingSales.length;
    const salesTotal = matchingSales.reduce((acc, s) => acc + (s.total || 0), 0);

    const totalOrders = Math.max(c.totalOrders || 0, salesCount);
    const totalSpent = Math.max(c.totalSpent || 0, salesTotal);

    const sortedSales = [...matchingSales].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const lastDate = sortedSales[0]?.createdAt 
      ? sortedSales[0].createdAt.split('T')[0] 
      : c.lastPurchaseDate;

    return {
      totalOrders,
      totalSpent,
      lastPurchaseDate: lastDate,
      salesList: sortedSales,
    };
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nifOrBi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const customerStats = useMemo(() => {
    let totalSpentSum = 0;
    let activeCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let newCustomersToday = 0;

    customers.forEach(c => {
      const m = getCustomerMetrics(c);
      totalSpentSum += m.totalSpent;
      if (m.totalOrders > 0 || c.status === 'active') {
        activeCount++;
      }
      if (m.lastPurchaseDate === todayStr) {
        newCustomersToday++;
      }
    });

    return {
      total: customers.length,
      active: activeCount,
      newCustomers: newCustomersToday,
      value: totalSpentSum,
    };
  }, [customers, sales]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        nifOrBi: customer.nifOrBi,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        nifOrBi: '',
        email: '',
        phone: '+244 9',
        city: 'Luanda',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? {
        ...c,
        name: formData.name,
        nifOrBi: formData.nifOrBi,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
      } : c));
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: formData.name,
        nifOrBi: formData.nifOrBi,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        totalOrders: 0,
        totalSpent: 0,
        status: 'active',
        lastPurchaseDate: new Date().toISOString().split('T')[0],
      };
      setCustomers(prev => [newCust, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteCustomer = (id: string) => {
    const cust = customers.find(c => c.id === id);
    if (cust) {
      setCustomerToDelete(cust);
    }
  };

  const confirmDeleteCustomer = (e?: React.MouseEvent) => {
    if (!customerToDelete) return;
    const targetCust = customerToDelete;
    setCustomers(prev => prev.filter(c => c.id !== targetCust.id));

    trash({
      id: targetCust.id,
      name: targetCust.name,
      type: 'customer',
      typeLabel: 'Cliente',
      data: targetCust,
      onRestore: (restored: Customer) => {
        setCustomers(prev => [restored, ...prev]);
      },
    }, e ? { clientX: e.clientX, clientY: e.clientY } : undefined);

    toast.success(`Cliente "${targetCust.name}" movido para a lixeira.`);
    setCustomerToDelete(null);
  };

  return (
    <div id="view-customers" className="workspace-view space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* BANNER DE UNDO NA PRÓPRIA PÁGINA (aparece instantaneamente aqui quando se apaga um cliente) */}
      <InlinePageUndoBanner pageType="customer" />
      <div className="flex justify-end">
        <button
          id="btn-add-customer"
          type="button"
          onClick={() => handleOpenModal()}
          className="btn--primary"
        >
          <span>Novo cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="kpi">
          <span className="kpi__label">Total de clientes</span>
          <strong className="kpi__value" data-numeric="true">{customerStats.total}</strong>
          <span className="kpi__meta">Base registada no sistema</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Clientes ativos</span>
          <strong className="kpi__value" data-numeric="true">{customerStats.active}</strong>
          <span className="kpi__meta">Com compras no período</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Novos hoje</span>
          <strong className="kpi__value" data-numeric="true">{customerStats.newCustomers}</strong>
          <span className="kpi__meta">Registados no turno atual</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Volume comprado</span>
          <strong className="kpi__value" data-numeric="true">{formatKz(customerStats.value)}</strong>
          <span className="kpi__meta">Total acumulado em Kwanzas</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          id="search-customers-input"
          type="text"
          placeholder="Pesquisar por nome, NIF/BI ou telefone de contacto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="workspace-control w-full pl-10 pr-4"
        />
      </div>

      {/* Customers Table */}
      <div className="workspace-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="workspace-table-head border-b border-zinc-200 font-semibold tracking-normal">
                <th className="py-3.5 px-4">Nome do Cliente</th>
                <th className="py-3.5 px-4">NIF / BI</th>
                <th className="py-3.5 px-4">Contactos</th>
                <th className="py-3.5 px-4">Localização</th>
                <th className="py-3.5 px-4 text-center">Compras</th>
                <th className="py-3.5 px-4 text-right">Total Faturado (Kz)</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const m = getCustomerMetrics(c);
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-950">{c.name}</div>
                        <span className="text-[10px] text-zinc-400">
                          Última compra: {m.lastPurchaseDate ? formatDate(m.lastPurchaseDate) : 'Sem registo recente'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-zinc-800">
                        {c.nifOrBi || 'Isento / Não inf.'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-800">{c.phone}</div>
                        <div className="text-[11px] text-zinc-400">{c.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600">
                        {c.city}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setHistoryCustomer(c)}
                          title="Ver histórico de compras deste cliente"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold transition-colors cursor-pointer text-xs"
                        >
                          <ShoppingBag size={13} className="text-zinc-600" />
                          <span>{m.totalOrders} {m.totalOrders === 1 ? 'compra' : 'compras'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-zinc-950 text-sm">
                          {formatKz(m.totalSpent)}
                        </div>
                        {m.totalOrders > 0 && (
                          <span className="mt-0.5 block text-[11px] font-normal text-zinc-500">
                            Média {formatKz(m.totalSpent / m.totalOrders)} por compra
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setHistoryCustomer(c)}
                            title={`Histórico de faturas de ${c.name}`}
                            aria-label={`Histórico de faturas de ${c.name}`}
                            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                          >
                            <Receipt size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenModal(c)}
                            aria-label={`Editar cliente ${c.name}`}
                            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                          >
                            <Edit size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(c.id)}
                            aria-label={`Remover cliente ${c.name}`}
                            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="workspace-panel max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-zinc-950">
                  {editingCustomer ? 'Editar Cliente' : 'Registar Novo Cliente'}
                </h3>
                <p className="text-zinc-400 text-[11px]">Dados cadastrais e identificação fiscal</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar formulário de cliente"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="customer-name" className="font-semibold text-zinc-800">Nome completo / Razão social</label>
                <input
                  id="customer-name"
                  name="name"
                  autoComplete="name"
                  type="text"
                  required
                  placeholder="Ex: Manuel Domingos dos Santos..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="customer-nif" className="font-semibold text-zinc-800">NIF ou BI (Angola)</label>
                  <input
                    id="customer-nif"
                    name="nifOrBi"
                    type="text"
                    required
                    placeholder="Ex: 5409182736 ou 00492..."
                    value={formData.nifOrBi}
                    onChange={(e) => setFormData({ ...formData, nifOrBi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="customer-phone" className="font-semibold text-zinc-800">Telefone</label>
                  <input
                    id="customer-phone"
                    name="phone"
                    autoComplete="tel"
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="customer-email" className="font-semibold text-zinc-800">Email</label>
                  <input
                    id="customer-email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    placeholder="cliente@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="customer-city" className="font-semibold text-zinc-800">Cidade / Província</label>
                  <input
                    id="customer-city"
                    name="city"
                    autoComplete="address-level2"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="workspace-secondary-action cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="workspace-primary-action cursor-pointer"
                >
                  Gravar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Histórico de Compras do Cliente */}
      {historyCustomer && (() => {
        const hm = getCustomerMetrics(historyCustomer);
        return (
          <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="workspace-panel max-w-2xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 text-sm max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-zinc-900 text-white">
                    <Receipt size={18} className="text-[#c8ff3d]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-950">
                      Histórico de Compras: {historyCustomer.name}
                    </h3>
                    <p className="text-zinc-500 text-xs">
                      NIF: {historyCustomer.nifOrBi || 'Isento'} · Tel: {historyCustomer.phone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryCustomer(null)}
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
                  aria-label="Fechar histórico"
                >
                  <X size={18} />
                </button>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-3 gap-2.5 bg-zinc-50 p-3 rounded-2xl border border-zinc-200/80">
                <div>
                  <span className="block text-[11px] font-medium text-zinc-500">Total de Compras</span>
                  <strong className="text-base font-extrabold text-zinc-950" data-numeric="true">
                    {hm.totalOrders}
                  </strong>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-zinc-500">Total Faturado</span>
                  <strong className="text-base font-extrabold text-zinc-950" data-numeric="true">
                    {formatKz(hm.totalSpent)}
                  </strong>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-zinc-500">Média por Compra</span>
                  <strong className="text-base font-extrabold text-zinc-950" data-numeric="true">
                    {hm.totalOrders > 0 ? formatKz(hm.totalSpent / hm.totalOrders) : '0 Kz'}
                  </strong>
                </div>
              </div>

              {/* Invoices List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {hm.salesList.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400">
                    <ShoppingBag size={32} className="mx-auto mb-2 text-zinc-300" />
                    <p className="font-semibold text-zinc-700">Nenhuma compra registada</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      As vendas associadas a este cliente no Caixa (POS) serão listadas aqui automaticamente.
                    </p>
                  </div>
                ) : (
                  hm.salesList.map((sale) => (
                    <div 
                      key={sale.id}
                      className="p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                            {sale.invoiceNumber}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {formatDateTime(sale.createdAt)}
                          </span>
                        </div>
                        <div className="font-extrabold text-sm text-zinc-950" data-numeric="true">
                          {formatKz(sale.total)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-600 gap-1 pt-1 border-t border-zinc-100">
                        <div>
                          <span className="text-zinc-400">Atendente: </span>
                          <span className="font-medium">{sale.cashierName || 'Atendente'}</span>
                          <span className="mx-1.5 text-zinc-300">·</span>
                          <span className="text-zinc-400">Pagamento: </span>
                          <span className="font-medium">
                            {sale.paymentMethod === 'cash' ? 'Numerário' : 
                             sale.paymentMethod === 'multicaixa' ? 'Multicaixa' : 
                             sale.paymentMethod === 'express' ? 'Multicaixa Express' :
                             sale.paymentMethod === 'transfer' ? 'Transferência' : 'Misto'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {sale.items?.length || 0} {(sale.items?.length || 0) === 1 ? 'artigo' : 'artigos'}
                        </div>
                      </div>

                      {sale.items && sale.items.length > 0 && (
                        <div className="bg-zinc-50 p-2 rounded-lg text-xs space-y-1">
                          {sale.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-zinc-700">
                              <span className="truncate pr-2">
                                <span className="font-bold">{it.quantity}x</span> {it.product?.name || 'Artigo'}
                              </span>
                              <span className="font-mono text-zinc-900" data-numeric="true">
                                {formatKz((it.product?.salePrice || 0) * it.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryCustomer(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-black text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Confirmação de Exclusão de Cliente */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        title="Eliminar Cliente"
        description={`Tem a certeza de que deseja eliminar o cliente "${customerToDelete?.name}" do cadastro? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Eliminar Cliente"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteCustomer}
        onClose={() => setCustomerToDelete(null)}
      />
    </div>
  );
};
