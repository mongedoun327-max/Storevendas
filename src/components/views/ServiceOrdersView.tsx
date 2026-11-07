import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Printer, 
  X, 
  Cpu, 
  User, 
  Phone, 
  Calendar,
  DollarSign,
  Sparkles,
  ChevronRight,
  Filter,
  Check,
  RotateCcw,
  Wrench,
  FilterX,
  Camera
} from 'lucide-react';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '../../types';
import { formatKz, formatDate, formatDateTime, getPriorityConfig } from '../../utils/formatters';
import { supabaseService } from '../../services/supabaseService';
import { Badge } from '../ui/deterministic/Badge';
import { OfflinePhotoAttachment } from '../ui/OfflinePhotoAttachment';

interface ServiceOrdersViewProps {
  workOrders: WorkOrder[];
  setWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
}

export const ServiceOrdersView: React.FC<ServiceOrdersViewProps> = ({
  workOrders,
  setWorkOrders,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWOForDetails, setSelectedWOForDetails] = useState<WorkOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for "Nova OS"
  const [formData, setFormData] = useState({
    code: '',
    customerName: '',
    customerPhone: '+244 9',
    equipment: '',
    serialNumber: '',
    reportedDefect: '',
    diagnosis: '',
    technician: '',
    priority: 'normal' as WorkOrderPriority,
    status: 'pending' as WorkOrderStatus,
    partsCost: '0',
    laborCost: '0',
    estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    photos: [] as string[],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const generateOSCode = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `OS-2026-0${randomSuffix}`;
  };

  const handleOpenNewOSModal = () => {
    setFormData({
      code: generateOSCode(),
      customerName: '',
      customerPhone: '+244 9',
      equipment: '',
      serialNumber: '',
      reportedDefect: '',
      diagnosis: '',
      technician: '',
      priority: 'normal',
      status: 'pending',
      partsCost: '0',
      laborCost: '0',
      estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      photos: [],
    });
    setIsModalOpen(true);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = parseFloat(formData.partsCost) || 0;
    const labor = parseFloat(formData.laborCost) || 0;

    const newWO: WorkOrder = {
      id: `wo-${Date.now()}`,
      code: formData.code || generateOSCode(),
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      equipment: formData.equipment.trim(),
      serialNumber: formData.serialNumber.trim(),
      reportedDefect: formData.reportedDefect.trim(),
      diagnosis: formData.diagnosis.trim(),
      technician: formData.technician,
      priority: formData.priority,
      status: formData.status,
      partsCost: parts,
      laborCost: labor,
      totalCost: parts + labor,
      createdAt: new Date().toISOString(),
      estimatedDelivery: formData.estimatedDelivery,
      photos: formData.photos,
    };

    setWorkOrders(prev => [newWO, ...prev]);
    setIsModalOpen(false);
    showToast(`Ordem de Serviço ${newWO.code} aberta com sucesso.`);

    // Asynchronously sync to Supabase
    supabaseService.insertServiceOrder(newWO).catch(err => console.warn('Supabase OS sync:', err));
  };

  const handleUpdateStatus = (id: string, newStatus: WorkOrderStatus) => {
    setWorkOrders(prev => prev.map(wo => wo.id === id ? { ...wo, status: newStatus } : wo));
    if (selectedWOForDetails && selectedWOForDetails.id === id) {
      setSelectedWOForDetails(prev => prev ? { ...prev, status: newStatus } : null);
    }
    showToast(`Estado da OS atualizado.`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  // Helper para Badges de Estado com Semântica Estrita (Secção 10.2 e 13.4 FSM)
  const renderStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success" label="Concluída e entregue" />;
      case 'completed':
        return <Badge variant="neutral" label="Pronta para entrega" />;
      case 'in_progress':
        return <Badge variant="neutral" label="Em reparação" />;
      case 'diagnosing':
        return <Badge variant="neutral" label="Em diagnóstico" />;
      case 'waiting_parts':
        return <Badge variant="neutral" label="Aguardando peças" />;
      case 'pending':
        return <Badge variant="neutral" label="Aberta" />;
      case 'canceled':
        return <Badge variant="neutral" label="Cancelada" />;
      default:
        return <Badge variant="neutral" label={status} />;
    }
  };

  // Real-time filter
  const filteredOrders = workOrders.filter((wo) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      wo.code.toLowerCase().includes(term) ||
      wo.customerName.toLowerCase().includes(term) ||
      wo.equipment.toLowerCase().includes(term) ||
      wo.reportedDefect.toLowerCase().includes(term) ||
      wo.technician.toLowerCase().includes(term);

    let matchesStatus = true;
    if (statusFilter === 'completed') {
      matchesStatus = wo.status === 'completed' || wo.status === 'delivered';
    } else if (statusFilter === 'in_progress') {
      matchesStatus = wo.status === 'in_progress' || wo.status === 'diagnosing' || wo.status === 'waiting_parts';
    } else if (statusFilter === 'pending') {
      matchesStatus = wo.status === 'pending' || wo.status === 'canceled';
    }

    return matchesSearch && matchesStatus;
  });

  const totalParts = parseFloat(formData.partsCost) || 0;
  const totalLabor = parseFloat(formData.laborCost) || 0;
  const formTotalCost = totalParts + totalLabor;
  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';
  const orderStats = [
    { label: 'Total de ordens', value: workOrders.length, tone: 'text-zinc-800', icon: FileText },
    { label: 'Abertas', value: workOrders.filter((order) => order.status === 'pending').length, tone: 'text-rose-700', icon: AlertCircle },
    { label: 'Em andamento', value: workOrders.filter((order) => ['diagnosing', 'waiting_parts', 'in_progress'].includes(order.status)).length, tone: 'text-amber-700', icon: Clock },
    { label: 'Concluídas', value: workOrders.filter((order) => ['completed', 'delivered'].includes(order.status)).length, tone: 'text-emerald-700', icon: CheckCircle2 },
    { label: 'Valor em carteira', value: formatKz(workOrders.reduce((total, order) => total + order.totalCost, 0)), tone: 'text-zinc-800', icon: DollarSign },
  ];

  return (
    <div id="view-work-orders" className="workspace-view space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CABEÇALHO COM AÇÕES & BOTÃO DE NOVA OS */}
      <div className="flex justify-end">
        <button
          id="btn-add-work-order"
          type="button"
          onClick={handleOpenNewOSModal}
          className="btn--primary"
        >
          <span>Nova ordem de serviço</span>
        </button>
      </div>

      {/* Grelha de 5 KPIs (Secção 13.4 A: Sem truncamento, único KPI escuro em Valor em Carteira) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="kpi">
          <span className="kpi__label">Total de ordens</span>
          <strong className="kpi__value" data-numeric="true">{workOrders.length}</strong>
          <span className="kpi__meta">Registos no período selecionado</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Abertas e pendentes</span>
          <strong className="kpi__value" data-numeric="true">
            {workOrders.filter((order) => order.status === 'pending').length}
          </strong>
          <span className="kpi__meta">A aguardar início de diagnóstico</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Em andamento</span>
          <strong className="kpi__value" data-numeric="true">
            {workOrders.filter((order) => ['diagnosing', 'waiting_parts', 'in_progress'].includes(order.status)).length}
          </strong>
          <span className="kpi__meta">Em diagnóstico, peças ou bancada</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Concluídas e entregues</span>
          <strong className="kpi__value" data-numeric="true">
            {workOrders.filter((order) => ['completed', 'delivered'].includes(order.status)).length}
          </strong>
          <span className="kpi__meta">
            Taxa de conclusão: {workOrders.length > 0 ? Math.round((workOrders.filter(o => ['completed', 'delivered'].includes(o.status)).length / workOrders.length) * 100) : 0}%
          </span>
        </div>
        <div className="kpi kpi--featured">
          <span className="kpi__label">Valor em carteira</span>
          <strong className="kpi__value" data-numeric="true">
            {formatKz(workOrders.reduce((total, order) => total + order.totalCost, 0))}
          </strong>
          <span className="kpi__meta">Soma das ordens ativas e concluídas</span>
        </div>
      </div>

      {/* FILTROS & BARRA DE PESQUISA REATIVA (Secção 13.4 B) */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Status Filter Chips: Estritamente neutros sem pontos de semáforo */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: `Todas (${workOrders.length})` },
            { id: 'pending', label: `Pendentes (${workOrders.filter(o => o.status === 'pending').length})` },
            { id: 'in_progress', label: `Em andamento (${workOrders.filter(o => ['diagnosing', 'waiting_parts', 'in_progress'].includes(o.status)).length})` },
            { id: 'completed', label: `Concluídas (${workOrders.filter(o => ['completed', 'delivered'].includes(o.status)).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              aria-pressed={statusFilter === tab.id}
              className={`filter-chip ${statusFilter === tab.id ? 'active' : ''}`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search input and clear action */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="search-work-orders-input"
              type="text"
              placeholder="Pesquisar por nº OS, cliente, equipamento ou técnico..."
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

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              title="Limpar todos os filtros"
              className="px-3 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FilterX size={14} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* TABELA DE LISTAGEM DE ORDENS DE SERVIÇO OU ESTADOS VAZIOS */}
      <div className="workspace-panel overflow-hidden">
        {workOrders.length === 0 ? (
          /* Estado Vazio Total */
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
              <Wrench size={32} />
            </div>
            <h3 className="font-bold text-base text-zinc-900">Nenhuma Ordem de Serviço Registrada</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-5">
              Abra a primeira OS técnica para acompanhar manutenções, peças e valores em Kz.
            </p>
            <button
              type="button"
              onClick={handleOpenNewOSModal}
              className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} className="text-amber-400" />
              <span>Abrir Primeira OS</span>
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Estado Sem Resultados de Pesquisa / Filtros */
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-gray-100 flex items-center justify-center text-zinc-400 mb-3">
              <Search size={26} />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Nenhuma OS encontrada</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">
              Não encontramos nenhuma Ordem de Serviço com os critérios de busca selecionados.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Redefinir Filtros</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="workspace-table-head border-b border-zinc-200 font-semibold">
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Descrição do Serviço</th>
                  <th className="py-3.5 px-4 text-center">Data</th>
                  <th className="py-3.5 px-4 text-right">Valor Total</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((wo) => {
                  const priorityConfig = getPriorityConfig(wo.priority);

                  return (
                    <tr key={wo.id} className="hover:bg-zinc-50/70 transition-colors group">
                      {/* COLUNA 1: Código OS & Prioridade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#111111]" data-numeric="true">
                            {wo.code}
                          </span>
                          {wo.priority === 'urgent' && (
                            <Badge variant="danger" label="Urgente" />
                          )}
                          {wo.priority === 'high' && (
                            <Badge variant="priority-high" label="Alta" />
                          )}
                        </div>
                      </td>

                      {/* COLUNA 2: Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900 text-xs">{wo.customerName}</div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5" data-numeric="true">
                          {wo.customerPhone}
                        </div>
                      </td>

                      {/* COLUNA 3: Equipamento / Serviço */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-900 text-xs truncate">
                            {wo.equipment}
                          </span>
                          {wo.photos && wo.photos.length > 0 && (
                            <span 
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-[10px] font-mono text-emerald-700 border border-emerald-200"
                              title={`${wo.photos.length} fotografia(s) anexada(s)`}
                            >
                              <Camera size={11} className="text-emerald-600" />
                              <span>{wo.photos.length}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5" title={wo.reportedDefect}>
                          {wo.reportedDefect}
                        </p>
                      </td>

                      {/* COLUNA 4: Data */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap text-[11px] text-zinc-500">
                        <div className="font-medium text-zinc-800" data-numeric="true">{formatDate(wo.createdAt)}</div>
                        <span className="text-[10px] text-zinc-400" data-numeric="true">Prev: {formatDate(wo.estimatedDelivery)}</span>
                      </td>

                      {/* COLUNA 5: Valor Total */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-[#111111] text-sm" data-numeric="true">
                          {formatKz(wo.totalCost)}
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)] block" data-numeric="true">
                          Mão de obra: {formatKz(wo.laborCost)}
                        </span>
                      </td>

                      {/* COLUNA 6: Estado (Badges Determinísticos) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(wo.status)}
                      </td>

                      {/* COLUNA 7: Ações */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <select
                            value={wo.status}
                            onChange={(e) => handleUpdateStatus(wo.id, e.target.value as WorkOrderStatus)}
                            aria-label={`Alterar estado de ${wo.code}`}
                            className="bg-white border border-[var(--line)] rounded-[var(--radius-control)] px-2 py-1 text-xs text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
                          >
                            <option value="pending">Aberta</option>
                            <option value="diagnosing">Em diagnóstico</option>
                            <option value="waiting_parts">Aguardando peças</option>
                            <option value="in_progress">Em reparação</option>
                            <option value="completed">Pronta para entrega</option>
                            <option value="delivered">Concluída e entregue</option>
                            <option value="canceled">Cancelada</option>
                          </select>

                          {wo.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(wo.id, 'delivered')}
                              className="btn--secondary h-7 px-2 text-xs font-semibold text-[#0b7a54] hover:bg-emerald-50 cursor-pointer"
                              title="Registar entrega ao cliente"
                            >
                              <span>Entregar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedWOForDetails(wo)}
                            className="btn--secondary h-7 px-2 text-xs cursor-pointer"
                            title="Ver Ficha Técnica"
                          >
                            <span>Detalhes</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES / FICHA TÉCNICA DA OS */}
      {selectedWOForDetails && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="workspace-panel max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span className="font-black text-base text-zinc-950 font-mono bg-zinc-100 px-2.5 py-1 rounded-xl">
                  {selectedWOForDetails.code}
                </span>
                {renderStatusBadge(selectedWOForDetails.status)}
              </div>
              <button
                type="button"
                onClick={() => setSelectedWOForDetails(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-zinc-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Cliente & Contacto</span>
                <p className="font-bold text-zinc-900 text-sm">{selectedWOForDetails.customerName}</p>
                <p className="text-zinc-600 text-xs mt-0.5">{selectedWOForDetails.customerPhone}</p>
              </div>

              <div className="bg-zinc-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Equipamento</span>
                <p className="font-bold text-zinc-900">{selectedWOForDetails.equipment}</p>
                {selectedWOForDetails.serialNumber && (
                  <p className="text-[11px] font-mono text-zinc-500">S/N: {selectedWOForDetails.serialNumber}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Defeito / Sintoma</span>
                <p className="text-zinc-700 bg-zinc-50 p-3 rounded-2xl border border-gray-100 leading-relaxed">
                  {selectedWOForDetails.reportedDefect}
                </p>
              </div>

              {selectedWOForDetails.diagnosis && (
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Diagnóstico & Parecer Técnico</span>
                  <p className="text-zinc-700 bg-zinc-50 p-3 rounded-2xl border border-gray-100 leading-relaxed">
                    {selectedWOForDetails.diagnosis}
                  </p>
                </div>
              )}

              {/* Fotografias Anexadas do Equipamento */}
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-gray-100 space-y-2">
                <OfflinePhotoAttachment
                  photos={selectedWOForDetails.photos || []}
                  onChange={(newPhotos) => {
                    const updated: WorkOrder = { ...selectedWOForDetails, photos: newPhotos };
                    setSelectedWOForDetails(updated);
                    setWorkOrders(prev => prev.map(w => w.id === updated.id ? updated : w));
                    showToast('Fotos da O.S. atualizadas localmente.');
                  }}
                  maxPhotos={6}
                  label="Fotografias do Equipamento (Avarias / Conclusão)"
                  helperText="Tire fotos com a câmara ou anexe imagens da entrada e do reparo concluído"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-zinc-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Técnico</span>
                  <span className="font-semibold text-zinc-800">{selectedWOForDetails.technician}</span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Entrega Estimada</span>
                  <span className="font-semibold text-zinc-800">{formatDate(selectedWOForDetails.estimatedDelivery)}</span>
                </div>
              </div>

              {/* Discriminação de Valores em Kwanzas (Kz) */}
              <div className="p-3.5 bg-zinc-950 text-white rounded-2xl space-y-1.5">
                <div className="flex justify-between text-zinc-400 text-xs">
                  <span>Custo Peças / Peças de Troca:</span>
                  <span>{formatKz(selectedWOForDetails.partsCost)}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-xs">
                  <span>Mão-de-Obra Técnica:</span>
                  <span>{formatKz(selectedWOForDetails.laborCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-emerald-400 pt-1.5 border-t border-zinc-800">
                  <span>Valor Total da OS:</span>
                  <span>{formatKz(selectedWOForDetails.totalCost)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  alert(`Imprimindo Ficha de Entrada ${selectedWOForDetails.code} em Kwanzas (Kz)...`);
                }}
                className="px-3.5 py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir Talão</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedWOForDetails(null)}
                className="workspace-primary-action px-5 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ABERTURA DE NOVA OS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="workspace-panel max-w-xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-zinc-950">Abertura de Nova Ordem de Serviço</h3>
                  <span className="font-mono text-xs font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-lg">
                    {formData.code}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Registo de entrada de equipamento e orçamento técnico em Kwanzas (Kz)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
              {/* Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Nome do Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Manuel Domingos..."
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Telefone</label>
                  <input
                    type="text"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Equipamento & Número de Série */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Equipamento / Modelo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MacBook Pro M2, Impressora Epson..."
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Nº de Série / IMEI (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: SN-2026-X892"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Defeito e Sintoma */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Defeito Reclamado / Serviço Solicitado</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Descreva o sintoma apresentado ou o serviço solicitado..."
                  value={formData.reportedDefect}
                  onChange={(e) => setFormData({ ...formData, reportedDefect: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                />
              </div>

              {/* Técnico & Previsão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Técnico Responsável</label>
                  <select
                    value={formData.technician}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  >
                    <option value="Eng. Adilson Silva">Eng. Adilson Silva</option>
                    <option value="Técnico Bernardo Kiala">Técnico Bernardo Kiala</option>
                    <option value="Técnico Mateus Gomes">Técnico Mateus Gomes</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Previsão de Entrega</label>
                  <input
                    type="date"
                    required
                    value={formData.estimatedDelivery}
                    onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Fotografias do Equipamento (Entrada / Avarias) */}
              <div className="p-3 bg-zinc-50 rounded-2xl border border-gray-200">
                <OfflinePhotoAttachment
                  photos={formData.photos}
                  onChange={(photos) => setFormData({ ...formData, photos })}
                  maxPhotos={4}
                  label="Fotografias do Equipamento (Avarias / Entrada)"
                  helperText="Tire fotos do aparelho com a câmara ou anexe imagens da entrada"
                />
              </div>

              {/* Valores em Kz: Peças + Mão de Obra */}
              <div className="p-3 bg-zinc-50 rounded-2xl border border-gray-200 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-700">Custo de Peças (Kz)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.partsCost}
                      onChange={(e) => setFormData({ ...formData, partsCost: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-zinc-900 focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-700">Mão-de-Obra (Kz)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.laborCost}
                      onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-zinc-900 focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                  <span className="font-bold text-zinc-700">Valor Total Previsto:</span>
                  <span className="font-black text-base text-zinc-950">{formatKz(formTotalCost)}</span>
                </div>
              </div>

              {/* Footer */}
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
                  Confirmar e Abrir OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Export both names for modular compatibility
export { ServiceOrdersView as WorkOrdersView };
