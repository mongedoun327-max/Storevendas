import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  FileJson,
  Package,
  ShoppingCart,
  Coins,
  Users,
  Wrench,
  TrendingDown,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { 
  loadStoredProducts, 
  saveStoredProducts, 
  loadStoredSales, 
  saveStoredSales, 
  loadStoredCustomers, 
  saveStoredCustomers,
  loadStoredWorkOrders, 
  saveStoredWorkOrders,
  loadStoredExpenses, 
  saveStoredExpenses,
  loadStoredCashMovements, 
  saveStoredCashMovements,
  loadStoredSettings, 
  saveStoredSettings,
  resetToDemoData 
} from '../../utils/storage';
import { 
  getMediaStats, 
  getAllMediaForBackup, 
  restoreMediaFromBackup, 
  clearAllMedia 
} from '../../utils/localMediaStorage';
import { ConfirmModal } from '../ui/ConfirmModal';
import { toast } from 'sonner';

export const LocalDatabasePanel: React.FC = () => {
  const [stats, setStats] = useState({
    productsCount: 0,
    salesCount: 0,
    customersCount: 0,
    workOrdersCount: 0,
    expensesCount: 0,
    cashMovementsCount: 0,
    mediaCount: 0,
    mediaSizeKb: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const p = loadStoredProducts();
      const s = loadStoredSales();
      const c = loadStoredCustomers();
      const w = loadStoredWorkOrders();
      const e = loadStoredExpenses();
      const m = loadStoredCashMovements();
      const media = await getMediaStats();

      setStats({
        productsCount: p.length,
        salesCount: s.length,
        customersCount: c.length,
        workOrdersCount: w.length,
        expensesCount: e.length,
        cashMovementsCount: m.length,
        mediaCount: media.count,
        mediaSizeKb: media.totalSizeKb,
      });
    } catch (err) {
      console.warn('Erro ao ler estatísticas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleExportBackup = async () => {
    try {
      setIsLoading(true);
      const mediaList = await getAllMediaForBackup();

      const backupData = {
        exportedAt: new Date().toISOString(),
        version: '1.1',
        system: 'Masakula ERP & PDV',
        settings: loadStoredSettings(),
        products: loadStoredProducts(),
        sales: loadStoredSales(),
        customers: loadStoredCustomers(),
        workOrders: loadStoredWorkOrders(),
        expenses: loadStoredExpenses(),
        cashMovements: loadStoredCashMovements(),
        mediaAttachments: mediaList,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `masakula_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Cópia de segurança (.json) descarregada com sucesso! (${mediaList.length} fotos incluídas)`);
    } catch (err: any) {
      toast.error(`Falha ao exportar backup: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || typeof parsed !== 'object') {
          toast.error('Arquivo de backup inválido.');
          return;
        }

        if (Array.isArray(parsed.products)) saveStoredProducts(parsed.products);
        if (Array.isArray(parsed.sales)) saveStoredSales(parsed.sales);
        if (Array.isArray(parsed.customers)) saveStoredCustomers(parsed.customers);
        if (Array.isArray(parsed.workOrders)) saveStoredWorkOrders(parsed.workOrders);
        if (Array.isArray(parsed.expenses)) saveStoredExpenses(parsed.expenses);
        if (Array.isArray(parsed.cashMovements)) saveStoredCashMovements(parsed.cashMovements);
        if (parsed.settings && typeof parsed.settings === 'object') saveStoredSettings(parsed.settings);
        if (Array.isArray(parsed.mediaAttachments)) {
          await restoreMediaFromBackup(parsed.mediaAttachments);
        }

        toast.success('Dados importados com sucesso! A recarregar o sistema...');
        loadStats();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err: any) {
        toast.error(`Erro ao processar arquivo: ${err.message || String(err)}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = async () => {
    try {
      setIsLoading(true);
      resetToDemoData();
      await clearAllMedia();
      toast.success('Base de dados e fotos apagadas com sucesso! O sistema foi reiniciado como folha em branco.');
      loadStats();
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      toast.error(`Erro ao limpar base: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
      setIsClearConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className="workspace-panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <Database className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">Dados guardados neste dispositivo</h3>
              <p className="mt-1 max-w-3xl text-sm leading-5 text-zinc-600">
                O ficheiro JSON inclui produtos, vendas, clientes, ordens de serviço, despesas, movimentos de caixa, definições e anexos fotográficos WebP offline. Guarde uma cópia fora deste dispositivo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadStats}
            disabled={isLoading}
            className="workspace-secondary-action self-start whitespace-nowrap cursor-pointer sm:self-auto"
          >
            <RefreshCw aria-hidden="true" className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar contagens
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-zinc-200 pt-4 sm:grid-cols-3 lg:grid-cols-7">
          {[
            { label: 'Produtos', value: stats.productsCount, icon: Package },
            { label: 'Vendas', value: stats.salesCount, icon: ShoppingCart },
            { label: 'Clientes', value: stats.customersCount, icon: Users },
            { label: 'Ordens de serviço', value: stats.workOrdersCount, icon: Wrench },
            { label: 'Despesas', value: stats.expensesCount, icon: TrendingDown },
            { label: 'Movimentos caixa', value: stats.cashMovementsCount, icon: Coins },
            { 
              label: 'Fotos Offline (WebP)', 
              value: `${stats.mediaCount} (${stats.mediaSizeKb > 1024 ? (stats.mediaSizeKb / 1024).toFixed(1) + ' MB' : stats.mediaSizeKb + ' KB'})`, 
              icon: Camera 
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={15} aria-hidden="true" className="shrink-0 text-zinc-500" />
              <div>
                <dt className="text-xs text-zinc-600 truncate max-w-[120px]">{label}</dt>
                <dd className="font-semibold tabular-nums text-zinc-950 text-xs sm:text-sm">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      {/* Backup and Restore Actions */}
      <div className="workspace-panel p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Button */}
          <div className="workspace-panel-muted flex flex-col justify-between p-4">
            <div>
              <div className="flex items-center gap-2 text-zinc-950 font-bold text-sm">
                <FileJson className="w-4 h-4 text-emerald-600" />
                Cópia de segurança
              </div>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Guarda os dados atuais num ficheiro JSON.
              </p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-2xl transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                Descarregar JSON
              </button>
            </div>
          </div>

          {/* Import Button */}
          <div className="workspace-panel-muted flex flex-col justify-between p-4">
            <div>
              <div className="flex items-center gap-2 text-zinc-950 font-bold text-sm">
                <Upload className="w-4 h-4 text-blue-600" />
                Restaurar dados
              </div>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Carrega os dados presentes no ficheiro selecionado.
              </p>
            </div>
            <div className="mt-4">
              <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-zinc-800 bg-white border border-gray-200 hover:bg-zinc-100 rounded-2xl cursor-pointer transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                Escolher ficheiro
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone: Clear */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setIsClearConfirmOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Zerar Dados (Folha em Branco)
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isClearConfirmOpen}
        title="Zerar Sistema & Iniciar Folha em Branco?"
        description="Atenção: Esta ação apagará os artigos, vendas e despesas registados para começar do zero. A conta de Administrador e a moeda Kz permanecerão ativas."
        confirmText="Sim, Zerar Dados"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleClearAll}
        onClose={() => setIsClearConfirmOpen(false)}
      />
    </div>
  );
};

export default LocalDatabasePanel;
