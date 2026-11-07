import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Building2, 
  Printer, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Coins, 
  Volume2, 
  Sliders,
  Users,
  UserCheck,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  Trash2,
  Edit2,
  Usb,
  Cpu,
  RefreshCw,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  Layers,
  X,
  Database
} from 'lucide-react';
import { CompanySettings, SystemUser } from '../../types';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { getStoredUsers, createAttendant, deleteAttendant, toggleUserStatus } from '../../utils/userAccounts';
import { PermissionMatrixModal } from '../auth/PermissionMatrixModal';
import AuditAndSecurityScreen from '../AuditAndSecurityScreen';
import { useSerialStatus } from '../../hooks/useSerialStatus';
import { getOrReconnectSerialPort, printSilentESCPOSToSerial } from '../../../utils/webSerialManager';
import { AnimatedTrashManager } from '../pdv/AnimatedTrashManager';
import { LocalDatabasePanel } from '../admin/LocalDatabasePanel';
import { saveStoredSettings } from '../../utils/storage';
import { ConfirmModal } from '../ui/ConfirmModal';
import { toast } from 'sonner';

interface SettingsViewProps {
  settings: CompanySettings;
  setSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
}

interface OperatorItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  terminal: string;
  active: boolean;
  lastLogin: string;
}

interface SettingsNavItem {
  id: 'fiscal' | 'hardware' | 'users' | 'audit' | 'trash' | 'database';
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

interface SettingsNavGroup {
  title: string;
  items: SettingsNavItem[];
}

const settingsNavigation: SettingsNavGroup[] = [
  {
    title: 'Loja',
    items: [
      { id: 'fiscal', label: 'Empresa e fiscal', description: 'Dados da loja e conformidade AGT', icon: Building2 },
    ],
  },
  {
    title: 'Operação',
    items: [
      { id: 'hardware', label: 'Caixa e impressão', description: 'Impressora e preferências do caixa', icon: Printer },
    ],
  },
  {
    title: 'Acesso e segurança',
    items: [
      { id: 'users', label: 'Utilizadores', description: 'Operadores e níveis de acesso', icon: Users },
      { id: 'audit', label: 'Auditoria', description: 'Painel demonstrativo de auditoria', icon: ShieldCheck },
    ],
  },
  {
    title: 'Dados',
    items: [
      { id: 'trash', label: 'Lixeira', description: 'Gestão de itens e arquivos excluídos', icon: Trash2 },
      { id: 'database', label: 'Banco local e backup', description: 'Cópias de segurança e restauro', icon: Database },
    ],
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  setSettings,
}) => {
  const { hasRole, profile } = useAuth();
  const isManager = hasRole(['GERENTE']);

  const [activeTab, setActiveTab] = useState<'fiscal' | 'hardware' | 'users' | 'audit' | 'trash' | 'database'>('fiscal');
  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const saveMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  const showSaveMessage = (message: string) => {
    if (saveMessageTimer.current) clearTimeout(saveMessageTimer.current);
    setSaveMessage(message);
    saveMessageTimer.current = setTimeout(() => setSaveMessage(null), 3000);
  };

  useEffect(() => () => {
    if (saveMessageTimer.current) clearTimeout(saveMessageTimer.current);
  }, []);

  // Sync formData whenever settings prop changes or reloads
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  // Hardware & Printer States (Persisted in localStorage)
  const { isConnected: isSerialConnected } = useSerialStatus();
  const [isPairing, setIsPairing] = useState(false);
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [printerPaper, setPrinterPaper] = useState<'80mm' | '58mm'>(() => {
    try {
      return (localStorage.getItem('masakula_printer_paper') as any) || '80mm';
    } catch {
      return '80mm';
    }
  });
  const [printerBaud, setPrinterBaud] = useState<'9600' | '19200' | '38400' | '115200'>(() => {
    try {
      return (localStorage.getItem('masakula_printer_baud') as any) || '9600';
    } catch {
      return '9600';
    }
  });
  const [testReceiptModalOpen, setTestReceiptModalOpen] = useState(false);

  const handleSelectPaper = (paper: '80mm' | '58mm') => {
    setPrinterPaper(paper);
    try {
      localStorage.setItem('masakula_printer_paper', paper);
      toast.success(`Largura da bobina ajustada para ${paper}.`);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSelectBaud = (baud: '9600' | '19200' | '38400' | '115200') => {
    setPrinterBaud(baud);
    try {
      localStorage.setItem('masakula_printer_baud', baud);
      toast.success(`Velocidade de transmissão ajustada para ${baud} bps.`);
    } catch (e) {
      console.warn(e);
    }
  };

  // Users & Attendants State (Persisted via userAccounts service)
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => getStoredUsers());
  const [showPinMap, setShowPinMap] = useState<Record<string, boolean>>({});
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserTerminal, setNewUserTerminal] = useState('Caixa 01 - Balcão Principal');
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settingsToSave: CompanySettings = { ...formData, defaultCurrency: 'Kz' };
    setSettings(settingsToSave);
    saveStoredSettings(settingsToSave);
    const message = activeTab === 'hardware' ? 'Preferências do caixa guardadas' : 'Dados da empresa guardados';
    showSaveMessage(message);
    toast.success(`${message} com sucesso.`);
  };

  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPin.trim()) {
      toast.error('Preencha o nome, e-mail e PIN de 4 dígitos.');
      return;
    }

    const result = createAttendant({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      pin: newUserPin.trim(),
      terminal: newUserTerminal
    });

    if (!result.success) {
      toast.error(result.error || 'Erro ao criar atendente.');
      return;
    }

    setSystemUsers(getStoredUsers());
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPin('');
    setIsNewUserModalOpen(false);
    showSaveMessage('Atendente criado');
    toast.success(`Atendente "${result.user?.name}" criado com sucesso! PIN de acesso: ${result.user?.pin}`);
  };

  const handleToggleUserStatus = (id: string) => {
    const res = toggleUserStatus(id);
    if (!res.success) {
      toast.error(res.error || 'Ação não permitida.');
      return;
    }
    setSystemUsers(getStoredUsers());
    toast.success('Estado do utilizador atualizado.');
  };

  const handleDeleteUser = (id: string, name: string) => {
    setUserToDelete({ id, name });
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    const { id, name } = userToDelete;
    const res = deleteAttendant(id);
    if (!res.success) {
      toast.error(res.error || 'Não é possível eliminar este utilizador.');
      setUserToDelete(null);
      return;
    }
    setSystemUsers(getStoredUsers());
    toast.success(`Utilizador "${name}" removido com sucesso.`);
    setUserToDelete(null);
  };

  const handlePairPrinter = async () => {
    setIsPairing(true);
    try {
      if (typeof navigator === 'undefined' || !('serial' in navigator)) {
        toast.info('Navegador sem Web Serial direto. O Masakula está a utilizar a fila de impressão nativa e talão PDF.');
        return;
      }
      await getOrReconnectSerialPort();
      toast.success('Impressora térmica USB/Serial autorizada e pronta para impressão!');
    } catch (err: any) {
      console.warn('Printer pairing:', err);
      if (err?.name === 'NotFoundError') {
        toast.info('Seleção de impressora cancelada.');
      } else if (
        err?.name === 'SecurityError' ||
        err?.message?.toLowerCase().includes('permissions policy') ||
        err?.message?.toLowerCase().includes('disallowed') ||
        err?.message?.toLowerCase().includes('separador')
      ) {
        toast.warning('Acesso à porta serial restrito no iframe de pré-visualização. Abra o sistema num novo separador para emparelhar com a impressora.');
      } else {
        toast.error('Não foi possível conectar: ' + (err?.message || 'erro de porta'));
      }
    } finally {
      setIsPairing(false);
    }
  };

  const handleTestPrint = async () => {
    setIsTestPrinting(true);
    try {
      if (typeof navigator !== 'undefined' && 'serial' in navigator) {
        const encoder = new TextEncoder();
        const header = encoder.encode(`\n=== MASAKULA SISTEMAS POS ===\n${formData.tradingName || 'LOJA PRINCIPAL'}\nNIF: ${formData.nif || '5417082910'}\n--------------------------------\n`);
        const body = encoder.encode(`TALÃO DE TESTE DE HARDWARE\nData: ${new Date().toLocaleDateString('pt-AO')} ${new Date().toLocaleTimeString('pt-AO')}\nLargura: ${printerPaper} | Baud: ${printerBaud} bps\nStatus da Porta: OK\n--------------------------------\nOBRIGADO PELA PREFERENCIA\n\n\n`);
        const cut = new Uint8Array([0x1d, 0x56, 0x00]); // GS V 0 (Cut paper)
        
        const fullBuffer = new Uint8Array(header.length + body.length + cut.length);
        fullBuffer.set(header, 0);
        fullBuffer.set(body, header.length);
        fullBuffer.set(cut, header.length + body.length);

        await printSilentESCPOSToSerial(fullBuffer);
        toast.success('Talão de teste enviado com sucesso para a impressora!');
      } else {
        setTestReceiptModalOpen(true);
        toast.info('Visualização do talão térmico gerada para verificação.');
      }
    } catch (err) {
      console.warn(err);
      setTestReceiptModalOpen(true);
      toast.info('Visualização do talão térmico gerada para verificação.');
    } finally {
      setIsTestPrinting(false);
    }
  };

  const handleTestDrawer = async () => {
    try {
      if (typeof navigator === 'undefined' || !('serial' in navigator)) {
        toast.info('Conecte uma impressora compatível por USB/Serial para testar a gaveta.');
        return;
      }

      const drawerCmd = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);
      await printSilentESCPOSToSerial(drawerCmd);
      toast.success('Comando de pulso de abertura de gaveta (F9 / Pulso RJ11) emitido!');
    } catch (err) {
      console.warn('Drawer test:', err);
      toast.error('Não foi possível enviar o comando para a gaveta. Verifique a ligação da impressora.');
    }
  };

  const handleClearPrinterCache = () => {
    try {
      localStorage.removeItem('worscoi_pos_printer_info');
      toast.success('Configuração memorizada da impressora foi redefinida.');
    } catch (e) {
      console.warn(e);
    }
  };

  const activeSection = settingsNavigation
    .flatMap((group) => group.items)
    .find((item) => item.id === activeTab);
  const ActiveSectionIcon = activeSection?.icon;

  return (
    <div id="view-settings" className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
        <div className="lg:hidden">
          <label htmlFor="settings-section" className="mb-1.5 block text-sm font-semibold text-zinc-700">
            Secção
          </label>
          <select
            id="settings-section"
            value={activeTab}
            onChange={(event) => setActiveTab(event.target.value as typeof activeTab)}
            className="min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            <optgroup label="Loja">
              <option value="fiscal">Empresa e fiscal</option>
            </optgroup>
            <optgroup label="Operação">
              <option value="hardware">Caixa e impressão</option>
            </optgroup>
            <optgroup label="Acesso e segurança">
              <option value="users">Utilizadores{!isManager ? ' (restrito)' : ''}</option>
              <option value="audit">Auditoria</option>
            </optgroup>
            <optgroup label="Dados">
              <option value="trash">Lixeira</option>
              <option value="database">Banco local e backup</option>
            </optgroup>
          </select>
        </div>

        <aside className="hidden rounded-2xl border border-zinc-200 bg-white p-3 lg:block">
          <nav aria-label="Secções de configurações" className="space-y-4">
            {settingsNavigation.map((group) => (
              <div key={group.title}>
                <h3 className="px-3 pb-1.5 text-xs font-semibold text-zinc-500">{group.title}</h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex min-h-12 w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-1 cursor-pointer ${
                          isActive
                            ? 'bg-zinc-100 text-zinc-950'
                            : 'text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        <Icon size={17} aria-hidden="true" className={`mt-0.5 shrink-0 ${isActive ? 'text-zinc-900' : 'text-zinc-500'}`} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                            {item.label}
                            {item.id === 'users' && !isManager && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">Restrito</span>
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <section aria-label="Conteúdo da secção de configurações" className="min-w-0">
          {activeSection && (
            <div className="mb-5 flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                  {ActiveSectionIcon && <ActiveSectionIcon size={19} aria-hidden="true" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold tracking-tight text-zinc-950">{activeSection.label}</h2>
                  <p className="mt-0.5 text-sm leading-5 text-zinc-600">{activeSection.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {activeTab === 'users' && isManager && (
                  <button
                    type="button"
                    onClick={() => setIsMatrixOpen(true)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 cursor-pointer"
                  >
                    <Shield size={16} aria-hidden="true" />
                    <span>Matriz de acessos</span>
                  </button>
                )}
                {saveMessage && (
                  <div role="status" className="flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-sm font-semibold text-emerald-800 animate-in fade-in">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>{saveMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}

      {/* TAB 1: FISCAL & COMPANY */}
      {activeTab === 'fiscal' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
            <p className="mb-5 text-sm text-zinc-600"><span className="font-semibold text-rose-700">*</span> Campo obrigatório</p>

            <fieldset className="grid grid-cols-1 gap-4 border-t border-zinc-200 pt-5 md:grid-cols-2">
              <legend className="col-span-full pb-3 pr-3 text-sm font-bold text-zinc-900">Identificação da empresa</legend>
              <div className="space-y-1.5">
                <label htmlFor="settings-company-name" className="text-sm font-medium text-zinc-800">Razão social <span className="text-rose-700">*</span></label>
                <input
                  id="settings-company-name"
                  name="companyName"
                  autoComplete="organization"
                  type="text"
                  required
                  placeholder="Ex.: Masakula Comércio Geral & Serviços, Lda"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-trading-name" className="text-sm font-medium text-zinc-800">Nome da loja nos talões <span className="text-rose-700">*</span></label>
                <input
                  id="settings-trading-name"
                  name="tradingName"
                  type="text"
                  required
                  placeholder="Ex.: Masakula Tech & Retail"
                  value={formData.tradingName}
                  onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>
            </fieldset>

            <fieldset className="mt-5 grid grid-cols-1 gap-4 border-t border-zinc-200 pt-5 md:grid-cols-2">
              <legend className="col-span-full pb-3 pr-3 text-sm font-bold text-zinc-900">Fiscal e faturação</legend>
              <div className="space-y-1.5">
                <label htmlFor="settings-nif" className="text-sm font-medium text-zinc-800">NIF <span className="text-rose-700">*</span></label>
                <input
                  id="settings-nif"
                  name="nif"
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Ex.: 5417082910"
                  value={formData.nif}
                  onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 font-mono text-sm text-zinc-900 placeholder:font-sans placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-iva" className="text-sm font-medium text-zinc-800">Regime de IVA</label>
                <select
                  id="settings-iva"
                  name="regimeIva"
                  value={formData.regimeIva}
                  onChange={(e) => setFormData({ ...formData, regimeIva: e.target.value as CompanySettings['regimeIva'] })}
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                >
                  <option value="Regime Geral (14%)">Regime Geral (14%)</option>
                  <option value="Regime Simplificado (7%)">Regime Simplificado (7%)</option>
                  <option value="Regime de Exclusão (0%)">Regime de Exclusão (0%)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-currency" className="text-sm font-medium text-zinc-800">Moeda de faturação</label>
                <input
                  id="settings-currency"
                  name="defaultCurrency"
                  readOnly
                  value="Kwanza (Kz)"
                  aria-describedby="settings-currency-help"
                  className="min-h-11 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3.5 text-sm text-zinc-700"
                />
                <p id="settings-currency-help" className="text-xs leading-5 text-zinc-600">O sistema usa Kz como moeda de faturação.</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-agt-certificate" className="text-sm font-medium text-zinc-800">Número do certificado AGT</label>
                <input
                  id="settings-agt-certificate"
                  name="agtCertificateNumber"
                  type="text"
                  placeholder="Ex.: AGT-CERT/2026/8920"
                  value={formData.agtCertificateNumber}
                  onChange={(e) => setFormData({ ...formData, agtCertificateNumber: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 font-mono text-sm text-zinc-900 placeholder:font-sans placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-terminal-id" className="text-sm font-medium text-zinc-800">Identificador do terminal POS</label>
                <input
                  id="settings-terminal-id"
                  name="posTerminalId"
                  type="text"
                  placeholder="Ex.: POS-01"
                  value={formData.posTerminalId}
                  onChange={(e) => setFormData({ ...formData, posTerminalId: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 font-mono text-sm text-zinc-900 placeholder:font-sans placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>
            </fieldset>

            <fieldset className="mt-5 grid grid-cols-1 gap-4 border-t border-zinc-200 pt-5 md:grid-cols-2">
              <legend className="col-span-full pb-3 pr-3 text-sm font-bold text-zinc-900">Contacto e endereço</legend>
              <div className="space-y-1.5">
                <label htmlFor="settings-phone" className="text-sm font-medium text-zinc-800">Telefone</label>
                <input
                  id="settings-phone"
                  name="phone"
                  autoComplete="tel"
                  type="tel"
                  placeholder="Ex.: +244 923 000 000"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-email" className="text-sm font-medium text-zinc-800">Email da empresa</label>
                <input
                  id="settings-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  placeholder="Ex.: contacto@suaempresa.co.ao"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-city" className="text-sm font-medium text-zinc-800">Cidade / Província</label>
                <input
                  id="settings-city"
                  name="city"
                  autoComplete="address-level2"
                  type="text"
                  placeholder="Ex.: Luanda"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="settings-address" className="text-sm font-medium text-zinc-800">Endereço comercial</label>
                <input
                  id="settings-address"
                  name="address"
                  autoComplete="street-address"
                  type="text"
                  placeholder="Ex.: Avenida 4 de Fevereiro, Edifício Masakula"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>
            </fieldset>
          </div>

          <div className="flex justify-end">
            <button
              id="btn-save-settings"
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              <Save size={16} aria-hidden="true" className="text-emerald-400" />
              <span>Guardar dados da empresa</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: HARDWARE */}
      {activeTab === 'hardware' && (
        <div className="space-y-6 text-xs">
          {/* Status da Conexão Serial / Impressora */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-zinc-900 font-bold text-sm">
                <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900">
                  <Printer size={18} />
                </div>
                <div>
                  <span className="block">Impressoras & Periféricos de Balcão</span>
                  <span className="text-xs text-zinc-500 font-normal">Controle de impressoras térmicas ESC/POS (80mm/58mm) e gavetas de dinheiro</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSerialConnected ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] flex items-center gap-1.5 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Impressora USB/Serial Conectada
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[11px] flex items-center gap-1.5 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Pronta para Emparelhamento
                  </span>
                )}
              </div>
            </div>

            {/* Ações Rápidas de Diagnóstico */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={handlePairPrinter}
                disabled={isPairing}
                className="p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Usb size={16} className={isPairing ? 'animate-spin' : 'text-emerald-400'} />
                <span>{isPairing ? 'A Procurar Porta...' : 'Emparelhar Impressora (USB/COM)'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestPrint}
                disabled={isTestPrinting}
                className="p-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] text-zinc-800 font-bold text-xs flex items-center justify-center gap-2.5 transition border border-zinc-200 cursor-pointer disabled:opacity-50"
              >
                <FileText size={16} className="text-blue-600" />
                <span>{isTestPrinting ? 'A Enviar...' : `Imprimir talão de teste (${printerPaper})`}</span>
              </button>

              <button
                type="button"
                onClick={handleTestDrawer}
                className="p-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] text-zinc-800 font-bold text-xs flex items-center justify-center gap-2.5 transition border border-zinc-200 cursor-pointer"
              >
                <Coins size={16} className="text-amber-600" />
                <span>Testar Abertura de Gaveta (F9)</span>
              </button>
            </div>

            {/* Parâmetros de Comunicação e Papel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-700 flex items-center gap-1.5">
                  <SlidersHorizontal size={14} className="text-zinc-500" />
                  <span>Largura da Bobina Térmica</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPaper('80mm')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      printerPaper === '80mm'
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                        : 'border-gray-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <span>80mm (48 Colunas)</span>
                    {printerPaper === '80mm' && <CheckCircle2 size={14} className="text-emerald-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPaper('58mm')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      printerPaper === '58mm'
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                        : 'border-gray-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <span>58mm (32 Colunas)</span>
                    {printerPaper === '58mm' && <CheckCircle2 size={14} className="text-emerald-400" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Cpu size={14} className="text-zinc-500" />
                  <span>Velocidade de Transmissão (Baud Rate)</span>
                </label>
                <select
                  value={printerBaud}
                  onChange={(e) => handleSelectBaud(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none cursor-pointer"
                >
                  <option value="9600">9600 bps (Padrão Epson / Xprinter / Bixolon)</option>
                  <option value="19200">19200 bps</option>
                  <option value="38400">38400 bps</option>
                  <option value="115200">115200 bps (Alta Velocidade)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preferências Operacionais */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-zinc-900 font-bold text-sm">
                <Sliders size={18} className="text-zinc-600" />
                <span>Comportamento Automático do Caixa</span>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100/70 cursor-pointer transition-colors border border-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.printReceiptOnCheckout}
                    onChange={(e) => setFormData({ ...formData, printReceiptOnCheckout: e.target.checked })}
                    className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-zinc-900 block">Imprimir talão automaticamente ao fechar venda</span>
                    <span className="text-[11px] text-zinc-500">Envia o documento para a impressora configurada ({printerPaper}).</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100/70 cursor-pointer transition-colors border border-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.allowNegativeStock}
                    onChange={(e) => setFormData({ ...formData, allowNegativeStock: e.target.checked })}
                    className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-zinc-900 block">Permitir venda de produtos sem stock</span>
                    <span className="text-[11px] text-zinc-500">Desativa o bloqueio caso o inventário esteja em zero</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100/70 cursor-pointer transition-colors border border-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.soundAlerts}
                    onChange={(e) => setFormData({ ...formData, soundAlerts: e.target.checked })}
                    className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-zinc-900 block">Sinais sonoros de leitor de código de barras</span>
                    <span className="text-[11px] text-zinc-500">Toca confirmação sonora ao registar artigos no carrinho</span>
                  </div>
                </label>
              </div>

              {/* Informações de Contingência do Navegador */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-blue-900 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <AlertCircle size={15} className="text-blue-600" />
                  <span>Compatibilidade de Impressão Direta</span>
                </div>
                <p className="text-blue-800/90 leading-relaxed">
                  A comunicação física via cabo USB com impressoras de recibos (ESC/POS) é suportada nativamente no Google Chrome e Microsoft Edge via <strong>Web Serial API</strong>. Em navegadores móveis ou sem permissão direta, o sistema utiliza o spooler de impressão nativo do sistema operacional sem perda de qualidade.
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearPrinterCache}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                  >
                    Redefinir memória de portas USB
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                id="btn-save-hardware-settings"
                type="submit"
                className="px-6 py-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Save size={16} className="text-emerald-400" />
                <span>Guardar Configurações de Hardware</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: USERS & OPERATORS (Protected by Role Matrix) */}
      {activeTab === 'users' && (
        <>
          {!isManager ? (
            /* Restricted UI for CAIXA */
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xs text-center space-y-4 max-w-lg mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                <Lock size={26} />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-zinc-950">Acesso Restrito ao Módulo de Usuários</h3>
                <p className="text-xs text-zinc-500">
                  A gestão, criação e edição de operadores e gerentes é restrita ao perfil <strong>GERENTE</strong> conforme a Matriz de Permissões.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-gray-200 text-left text-xs space-y-1">
                <p className="font-bold text-zinc-800">Regra de Segurança da Matriz:</p>
                <p className="text-zinc-600">
                  • <strong>Gestão de Usuários & Operadores:</strong> Caixa ❌ Acesso Negado | Gerente ✅ Permissão Total
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMatrixOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shield size={14} />
                <span>Consultar Matriz de Permissões</span>
              </button>
            </div>
          ) : (
            /* Manager Full View */
            <div className="space-y-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-zinc-950 text-white">
                    <UserCheck size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-950">Gestão de Atendentes &amp; Acessos</h3>
                    <p className="text-zinc-600 text-xs">Cadastre e gira os operadores de caixa com PIN e terminal atribuído.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(true)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 cursor-pointer shadow-xs"
                >
                  <UserPlus size={15} className="text-emerald-400" />
                  <span>Cadastrar Novo Atendente</span>
                </button>
              </div>

              {/* Operators Table */}
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-gray-100 text-zinc-500 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Utilizador / E-mail</th>
                      <th className="py-3.5 px-4">Perfil &amp; Permissão</th>
                      <th className="py-3.5 px-4">PIN de Acesso</th>
                      <th className="py-3.5 px-4">Terminal Designado</th>
                      <th className="py-3.5 px-4">Último Acesso</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {systemUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-400 text-xs font-medium">
                          Nenhum utilizador ou atendente cadastrado.
                        </td>
                      </tr>
                    ) : (
                      systemUsers.map((u) => {
                        const isPinVisible = showPinMap[u.id];
                        const isAdminAccount = u.role === 'admin';

                        return (
                          <tr key={u.id} className="hover:bg-zinc-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-zinc-950 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isAdminAccount && <span className="text-[10px] text-purple-700 bg-purple-50 px-1 rounded">Principal</span>}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono">{u.email}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                isAdminAccount 
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {isAdminAccount ? '👑 Administrador Master' : '👤 Atendente de Caixa'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-zinc-800">
                              <div className="flex items-center gap-2">
                                <span className="tracking-widest bg-zinc-100 px-2 py-0.5 rounded text-xs">
                                  {isPinVisible ? u.pin : '••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowPinMap(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                                  className="text-zinc-400 hover:text-zinc-700 p-1 rounded cursor-pointer"
                                  title={isPinVisible ? 'Ocultar PIN' : 'Ver PIN'}
                                >
                                  {isPinVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-zinc-600 font-medium">
                              {u.terminal}
                            </td>
                            <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                              {u.lastLogin || 'Nunca'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u.id)}
                                disabled={isAdminAccount}
                                aria-label={`${u.active ? 'Desativar' : 'Ativar'} operador ${u.name}`}
                                aria-pressed={u.active}
                                className={`min-h-8 min-w-[76px] rounded-full px-3 text-xs font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                                  u.active 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-zinc-100 text-zinc-500 border border-gray-200 hover:bg-zinc-200'
                                }`}
                              >
                                {u.active ? '● Ativo' : '○ Inativo'}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                disabled={isAdminAccount}
                                aria-label={`Remover atendente ${u.name}`}
                                className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-xl text-zinc-500 hover:text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                                title={isAdminAccount ? 'Conta protegida' : 'Eliminar utilizador'}
                              >
                                <Trash2 size={14} />
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
          )}
        </>
      )}

      {/* Modal: Novo Atendente (Gerente) */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-zinc-800" />
                <h3 className="font-bold text-sm text-zinc-950">Cadastrar Novo Atendente</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(false)}
                aria-label="Fechar cadastro de operador"
                className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 cursor-pointer"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddOperator} className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="operator-name" className="font-semibold text-zinc-800">Nome do Atendente</label>
                <input
                  id="operator-name"
                  name="name"
                  autoComplete="name"
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Maria António"
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="operator-email" className="font-semibold text-zinc-800">E-mail de Acesso</label>
                <input
                  id="operator-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Ex: atende2@masakula.co.ao"
                  className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="operator-pin" className="font-semibold text-zinc-800 flex items-center gap-1">
                    <KeyRound size={13} className="text-zinc-500" />
                    <span>PIN (4 Dígitos)</span>
                  </label>
                  <input
                    id="operator-pin"
                    name="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Ex: 7821"
                    className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm font-mono font-bold text-zinc-900 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="operator-terminal" className="font-semibold text-zinc-800">Terminal</label>
                  <select
                    id="operator-terminal"
                    name="terminal"
                    value={newUserTerminal}
                    onChange={(e) => setNewUserTerminal(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200 cursor-pointer"
                  >
                    <option value="Caixa 01 - Balcão Principal">Caixa 01</option>
                    <option value="Caixa 02 - Frente de Loja">Caixa 02</option>
                    <option value="Caixa 03 - Balcão Secundário">Caixa 03</option>
                  </select>
                </div>
              </div>

              {/* Informação de Segurança sobre Acesso do Atendente */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>🔒 Regra de Segurança do Atendente:</strong>
                <p className="mt-0.5 text-amber-800">
                  Os atendentes têm acesso estritamente limitado ao Ponto de Venda (PDV), Consulta de Artigos e Registo de Presença. As abas de <strong>Relatórios</strong>, <strong>Despesas</strong> e <strong>Configurações</strong> ficam totalmente ocultas e inacessíveis na sessão do atendente.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="min-h-11 rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-11 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 cursor-pointer"
                >
                  Criar Conta de Atendente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT & GOVERNANCE */}
      {activeTab === 'audit' && (
        <div className="min-w-0">
          <AuditAndSecurityScreen />
        </div>
      )}

      {/* TAB 5: LIXEIRA & RECICLAGEM ANIMADA */}
      {activeTab === 'trash' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <AnimatedTrashManager
            onPermanentDelete={(item) => {
              toast.info(`O item "${item.name}" foi eliminado definitivamente.`);
            }}
            onRestore={(item) => {
              toast.success(`O item "${item.name}" foi restaurado com sucesso.`);
            }}
          />
        </div>
      )}

      {/* TAB 6: BANCO LOCAL & BACKUP INDEXEDDB */}
      {activeTab === 'database' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <LocalDatabasePanel />
        </div>
      )}

        </section>
      </div>

      {/* Modal de pré-visualização do talão térmico de teste */}
      {testReceiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-zinc-900" />
                <h3 className="font-bold text-sm text-zinc-950">Pré-visualização do talão ({printerPaper})</h3>
              </div>
              <button
                type="button"
                onClick={() => setTestReceiptModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Simulação física do papel térmico */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 font-mono text-[11px] leading-relaxed text-zinc-800 shadow-inner">
              <div className="text-center font-bold pb-2 border-b border-dashed border-zinc-300">
                <p className="text-xs uppercase">{formData.tradingName || 'LOJA MASAKULA'}</p>
                <p className="text-[10px] text-zinc-500 font-normal">{formData.companyName}</p>
                <p className="text-[10px] text-zinc-500 font-normal">NIF: {formData.nif || '5417082910'}</p>
                <p className="text-[10px] text-zinc-500 font-normal">{formData.address || 'Luanda, Angola'}</p>
              </div>

              <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1">
                <div className="flex justify-between">
                  <span>DOCUMENTO:</span>
                  <span className="font-bold">TALÃO TESTE/01</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>DATA:</span>
                  <span>{new Date().toLocaleDateString('pt-AO')} {new Date().toLocaleTimeString('pt-AO')}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>BOBINA:</span>
                  <span>{printerPaper} ({printerBaud} bps)</span>
                </div>
              </div>

              <div className="py-2.5 border-b border-dashed border-zinc-300 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span>ARTIGO DE TESTE {printerPaper}</span>
                  <span>1.500,00 Kz</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>1 x 1.500,00 Kz (IVA 14% Incl.)</span>
                  <span>Taxa Normal</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-zinc-300 space-y-1">
                <div className="flex justify-between font-bold text-xs">
                  <span>TOTAL A PAGAR:</span>
                  <span>1.500,00 Kz</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>NUMERÁRIO:</span>
                  <span>2.000,00 Kz</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>TROCO:</span>
                  <span>500,00 Kz</span>
                </div>
              </div>

              <div className="pt-3 text-center text-[10px] text-zinc-500 space-y-1">
                <p className="font-bold text-zinc-700">SOFTWARE CERTIFICADO AGT Nº 999/AGT/2026</p>
                <p>Obrigado pela preferência!</p>
                <div className="pt-2 text-[9px] text-zinc-400 font-sans italic">
                  [Corte Automático de Papel ESC/POS GS V 0]
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setTestReceiptModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir no Sistema</span>
              </button>
              <button
                type="button"
                onClick={() => setTestReceiptModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Matrix Modal */}
      <PermissionMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />

      {/* Modal de Confirmação de Exclusão de Utilizador */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Remover Utilizador"
        description={`Tem a certeza de que deseja remover o utilizador "${userToDelete?.name}" do sistema? Esta conta perderá o acesso imediato aos terminais de venda.`}
        confirmText="Sim, Remover Utilizador"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteUser}
        onClose={() => setUserToDelete(null)}
      />
    </div>
  );
};
