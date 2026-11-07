import React, { useState, useEffect } from 'react';
import { 
  Barcode, 
  Printer, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Usb, 
  Cable, 
  Scan,
  ShieldCheck,
  Check
} from 'lucide-react';
import { hardwareService } from '../../services/hardwareIntegration';
import { toast } from 'sonner';

interface HardwareDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateScan?: (barcode: string) => void;
}

export const HardwareDevicesModal: React.FC<HardwareDevicesModalProps> = ({
  isOpen,
  onClose,
  onSimulateScan
}) => {
  const [lastScanned, setLastScanned] = useState<string | null>(hardwareService.getLastScanned());
  const [isConnectingPrinter, setIsConnectingPrinter] = useState(false);
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = hardwareService.onScan((code) => {
      setLastScanned(code);
      toast.success(`Leitor de barras capturou: ${code}`, {
        duration: 2500,
        icon: <Scan size={16} className="text-emerald-500" />
      });
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectPrinter = async () => {
    setIsConnectingPrinter(true);
    try {
      const res = await hardwareService.connectSerialPrinter();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.info(res.message);
      }
    } finally {
      setIsConnectingPrinter(false);
    }
  };

  const handleTestPrint = async () => {
    setIsTestingPrinter(true);
    try {
      const res = await hardwareService.printTestSlip();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsTestingPrinter(false);
    }
  };

  const handleSendManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    hardwareService.handleScannedBarcode(manualCode.trim());
    if (onSimulateScan) {
      onSimulateScan(manualCode.trim());
    }
    toast.success(`Código de barras processado: ${manualCode.trim()}`);
    setManualCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-xl border border-zinc-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-[#E1FB15] flex items-center justify-center shadow-xs">
              <Cable size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-900">Periféricos & Hardware POS</h2>
              <p className="text-xs text-zinc-500">Conexão do Aparelho de Bipar e da Maquininha de Imprimir Talões</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Card 1: Aparelho de Bipar (Leitor de Códigos de Barras) */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Scan size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">Aparelho de Bipar (Scanner)</h3>
                  <p className="text-xs text-zinc-500">Leitor laser/óptico USB ou sem fio para venda e cadastro</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Ativo & Pronto
              </span>
            </div>

            <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 text-xs text-zinc-700 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-500">Modo de Operação:</span>
                <span className="font-bold text-zinc-900">Detecção Universal HID / Teclado Rápido</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-zinc-500">Último Código Bipado:</span>
                <span className="font-mono font-bold text-zinc-900">
                  {lastScanned || 'Nenhum código lido ainda'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSendManualScan} className="flex gap-2">
              <input
                type="text"
                placeholder="Digitar ou testar código de barras..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Testar Bip
              </button>
            </form>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Regra de Códigos de Barra:</strong> O sistema não gera códigos de barra fictícios. A identificação dos artigos depende integralmente dos códigos de barras de fábrica já impressos na embalagem do produto.
              </span>
            </div>
          </div>

          {/* Card 2: Maquininha de Imprimir Talões (Impressora Térmica) */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Printer size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900">Maquininha de Imprimir Talões</h3>
                  <p className="text-xs text-zinc-500">Impressora térmica padrão ESC/POS (80mm e 58mm)</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Pronta para Impressão
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <span className="text-[10px] text-zinc-500 uppercase font-black block mb-1">Largura da Bobina</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperWidth('80mm')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold border cursor-pointer transition ${
                      paperWidth === '80mm'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    80mm (Padrão)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperWidth('58mm')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold border cursor-pointer transition ${
                      paperWidth === '58mm'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    58mm (Compacto)
                  </button>
                </div>
              </div>

              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <span className="text-[10px] text-zinc-500 uppercase font-black block mb-1">Protocolo de Comunicação</span>
                <p className="font-semibold text-zinc-800 text-xs">ESC/POS + Web Serial / Layout Térmico AGT</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={isConnectingPrinter}
                onClick={handleConnectPrinter}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Usb size={14} />
                <span>{isConnectingPrinter ? 'A Procurar Porta...' : 'Conectar Porta USB / Serial'}</span>
              </button>

              <button
                type="button"
                disabled={isTestingPrinter}
                onClick={handleTestPrint}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Printer size={14} />
                <span>{isTestingPrinter ? 'A Enviar...' : 'Testar Impressão na Maquininha'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Compatível com leitores e impressoras térmicas físicas plug-and-play</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

export default HardwareDevicesModal;
