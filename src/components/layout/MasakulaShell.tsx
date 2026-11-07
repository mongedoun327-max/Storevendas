import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';
import { ActiveTab, Product, WorkOrder, Customer, SaleTransaction, CompanySettings } from '../../types';
import { DashboardView } from '../views/DashboardView';
import { ProductsView } from '../views/ProductsView';
import { ServiceOrdersView } from '../views/ServiceOrdersView';
import { PosView } from '../views/PosView';
import { CustomersView } from '../views/CustomersView';
import { ReportsView } from '../views/ReportsView';
import { SettingsView } from '../views/SettingsView';
import {
  loadStoredProducts,
  saveStoredProducts,
  loadStoredWorkOrders,
  saveStoredWorkOrders,
  loadStoredCustomers,
  saveStoredCustomers,
  loadStoredSales,
  saveStoredSales,
  loadStoredSettings,
  saveStoredSettings,
} from '../../utils/storage';

export interface NavigationItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
  { id: 'products', label: 'Gestão de Produtos', icon: Package },
  { id: 'service_orders', label: 'Ordens de Serviço', icon: Wrench },
  { id: 'sales', label: 'Vendas & PDV', icon: ShoppingCart },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
];

export default function MasakulaShell({ onLogout }: { onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');

  // Durable persistent data
  const [products, setProducts] = useState<Product[]>(() => loadStoredProducts());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => loadStoredWorkOrders());
  const [customers, setCustomers] = useState<Customer[]>(() => loadStoredCustomers());
  const [sales, setSales] = useState<SaleTransaction[]>(() => loadStoredSales());
  const [settings, setSettings] = useState<CompanySettings>(() => loadStoredSettings());

  // Auto-sync storage
  React.useEffect(() => saveStoredProducts(products), [products]);
  React.useEffect(() => saveStoredWorkOrders(workOrders), [workOrders]);
  React.useEffect(() => saveStoredCustomers(customers), [customers]);
  React.useEffect(() => saveStoredSales(sales), [sales]);
  React.useEffect(() => saveStoredSettings(settings), [settings]);

  const activeItem = NAVIGATION_ITEMS.find((i) => i.id === activeTab);
  const activeTitle = activeItem?.label || (activeTab === 'settings' ? 'Configurações' : 'Masakula System');

  return (
    <div id="masakula-shell" className="min-h-screen bg-[#fcfcfc] flex font-sans select-none overflow-x-hidden">
      {/* SIDEBAR NAVEGAÇÃO */}
      <aside className="w-16 bg-white border-r border-gray-100 flex flex-col items-center py-6 gap-6 z-20 shrink-0">
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="text-red-600 font-black text-2xl cursor-pointer hover:scale-105 transition"
          title="Masakula System"
        >
          M
        </div>

        <nav className="flex flex-col gap-3 text-gray-400 mt-2" aria-label="Navegação Masakula">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-2.5 rounded-2xl transition relative group cursor-pointer ${
                  isActive ? 'bg-black text-white shadow-md' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title={item.label}
              >
                <Icon size={20} />
                <span className="absolute left-16 bg-black text-white text-[11px] font-bold px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-30 pointer-events-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-2.5 rounded-2xl transition relative group cursor-pointer ${
              activeTab === 'settings' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:bg-gray-100'
            }`}
            title="Configurações"
          >
            <Settings size={20} />
            <span className="absolute left-16 bg-black text-white text-[11px] font-bold px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-30 pointer-events-none">
              Configurações
            </span>
          </button>

          <button 
            onClick={onLogout}
            className="p-2.5 rounded-2xl text-red-500 hover:bg-red-50 transition cursor-pointer"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-6 sm:p-8 max-w-[1400px] mx-auto w-full space-y-6">
        {/* Banner de Título e Status */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-900 capitalize">
              {activeTitle}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800">
              Kz (AOA)
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Módulo <span className="font-bold text-gray-700">{activeTab}</span> ativo. Pronto para receber os componentes da próxima fase.
          </p>
        </div>

        {/* Renderização do Módulo Interativo Ativo */}
        <div className="w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={(tab) => {
                if (tab === 'pos') setActiveTab('sales');
                else if (tab === 'services') setActiveTab('service_orders');
                else setActiveTab(tab as ActiveTab);
              }}
              products={products}
              workOrders={workOrders}
              customers={customers}
              sales={sales}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              setProducts={setProducts}
            />
          )}

          {activeTab === 'service_orders' && (
            <ServiceOrdersView
              workOrders={workOrders}
              setWorkOrders={setWorkOrders}
            />
          )}

          {activeTab === 'sales' && (
            <PosView
              products={products}
              setProducts={setProducts}
              sales={sales}
              setSales={setSales}
              customers={customers}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              setCustomers={setCustomers}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              sales={sales}
              products={products}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              setSettings={setSettings}
            />
          )}
        </div>
      </main>
    </div>
  );
}
