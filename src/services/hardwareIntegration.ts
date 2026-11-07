/**
 * Serviço Unificado de Integração de Hardware POS
 * - Aparelho de Bipar (Leitor de Códigos de Barras HID / USB / Serial)
 * - Maquininha de Imprimir Talões (Impressoras Térmicas ESC/POS 80mm/58mm via Web Serial, WebUSB e Fallback de Impressão)
 */

import { EscPosBuilder } from '../lib/printer/escposBuilder';

export interface HardwareReceiptItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface HardwareReceiptData {
  companyName: string;
  nif?: string;
  invoiceNumber: string;
  date: string;
  operatorName: string;
  customerName?: string;
  customerNif?: string;
  items: HardwareReceiptItem[];
  subtotal: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  amountPaid?: number;
  changeGiven?: number;
}

export interface HardwareStatus {
  scannerReady: boolean;
  lastScannedCode: string | null;
  printerConnected: boolean;
  printerPortName: string | null;
  printerType: 'serial' | 'system';
}

class HardwareIntegrationService {
  private activeSerialPort: any = null;
  private lastScannedCode: string | null = null;
  private scannerListeners: Array<(barcode: string) => void> = [];
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.initGlobalScanner();
  }

  // Som característico do leitor de código de barras físico
  public playBeep(type: 'beep' | 'success' | 'error' = 'beep') {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioCtx();
      }
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, ctx.currentTime);
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2600, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // AudioContext não disponível
    }
  }

  // Inicia escuta global de leitores de código de barras (emulação de teclado HID)
  private initGlobalScanner() {
    if (typeof window === 'undefined') return;

    let buffer = '';
    let lastKeyTime = 0;
    const TIME_THRESHOLD_MS = 45; // Intervalo rápido característico de lasers de código de barras

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      // Se o tempo entre teclas for maior que o limiar de um scanner mecânico, reseta o buffer
      if (diff > TIME_THRESHOLD_MS && buffer.length > 0) {
        buffer = '';
      }

      if (e.key === 'Enter') {
        const trimmed = buffer.trim();
        // A maioria dos códigos de fábrica (EAN-13, EAN-8, UPC, Code128) tem >= 3 caracteres
        if (trimmed.length >= 3 && diff <= TIME_THRESHOLD_MS * 2.5) {
          // Previne submissão acidental de formulários por causa do Enter final do scanner
          if (!isInput) {
            e.preventDefault();
          }
          this.handleScannedBarcode(trimmed);
        }
        buffer = '';
        return;
      }

      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer += e.key;
      }
    }, true);
  }

  public handleScannedBarcode(barcode: string) {
    this.lastScannedCode = barcode;
    this.playBeep('beep');
    // Notifica todos os ouvintes ativos (ex: tela de PDV ou modal de cadastro aberto)
    this.scannerListeners.forEach(listener => {
      try {
        listener(barcode);
      } catch (err) {
        console.warn('Erro ao processar leitor de código de barras:', err);
      }
    });
  }

  // Registra um ouvinte para o scanner (com retorno de função de desinscrição)
  public onScan(callback: (barcode: string) => void): () => void {
    this.scannerListeners.push(callback);
    return () => {
      this.scannerListeners = this.scannerListeners.filter(cb => cb !== callback);
    };
  }

  public getLastScanned(): string | null {
    return this.lastScannedCode;
  }

  // Verifica suporte à Web Serial API
  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  // Solicita ao operador permissão para conectar à maquininha térmica via porta COM / USB Serial
  public async connectSerialPrinter(): Promise<{ success: boolean; message: string }> {
    if (!this.isWebSerialSupported()) {
      return {
        success: false,
        message: 'Web Serial API não é suportada neste navegador. Será utilizado o driver de impressão térmica do sistema.'
      };
    }

    try {
      const serialNav = navigator as any;
      const port = await serialNav.serial.requestPort();
      if (!port) {
        return { success: false, message: 'Nenhuma porta selecionada.' };
      }

      await port.open({ baudRate: 9600 });
      this.activeSerialPort = port;
      return {
        success: true,
        message: 'Maquininha de talões conectada com sucesso via porta serial!'
      };
    } catch (err: any) {
      if (err?.name === 'SecurityError' || err?.message?.includes('permissions policy')) {
        return {
          success: false,
          message: 'Acesso serial restrito no iframe de teste. O sistema utilizará o diálogo térmico otimizado (80mm/58mm).'
        };
      }
      return {
        success: false,
        message: err?.message || 'Não foi possível conectar à impressora serial.'
      };
    }
  }

  // Constrói payload ESC/POS binário para envio direto à maquininha térmica
  public buildReceiptEscPos(data: HardwareReceiptData, paperWidth: '80mm' | '58mm' = '80mm'): Uint8Array {
    const builder = new EscPosBuilder();
    const cols = paperWidth === '58mm' ? 32 : 48;

    builder
      .init()
      .align('center')
      .bold(true)
      .size(1, 1)
      .line(data.companyName.toUpperCase())
      .size(0, 0)
      .bold(false)
      .line(data.nif ? `NIF: ${data.nif}` : 'NIF: Consumidor Final')
      .line('-'.repeat(cols))
      .align('left')
      .line(`FATURA/TALÃO: ${data.invoiceNumber}`)
      .line(`DATA: ${data.date}`)
      .line(`OPERADOR: ${data.operatorName}`)
      .line(`CLIENTE: ${data.customerName || 'Consumidor Final'}`)
      .line('-'.repeat(cols));

    // Itens
    data.items.forEach(item => {
      const nameLine = item.name.length > cols ? item.name.substring(0, cols) : item.name;
      builder.line(nameLine);
      const leftCol = ` ${item.quantity}x ${item.price.toLocaleString('pt-AO')} Kz`;
      const rightCol = `${item.subtotal.toLocaleString('pt-AO')} Kz`;
      const spaceCount = Math.max(1, cols - leftCol.length - rightCol.length);
      builder.line(leftCol + ' '.repeat(spaceCount) + rightCol);
    });

    builder
      .line('-'.repeat(cols))
      .bold(true)
      .row('TOTAL:', `${data.total.toLocaleString('pt-AO')} Kz`, cols)
      .bold(false);

    if (data.amountPaid !== undefined && data.amountPaid > 0) {
      builder.row('Entregue:', `${data.amountPaid.toLocaleString('pt-AO')} Kz`, cols);
    }
    if (data.changeGiven !== undefined && data.changeGiven > 0) {
      builder.row('Troco:', `${data.changeGiven.toLocaleString('pt-AO')} Kz`, cols);
    }

    builder
      .row('Pagamento:', data.paymentMethod, cols)
      .line('-'.repeat(cols))
      .align('center')
      .line('Obrigado pela preferência!')
      .line('Processado por programa certificado')
      .feed(3)
      .cut();

    return builder.build();
  }

  // Dispara a impressão na maquininha
  public async printReceipt(data: HardwareReceiptData, paperWidth: '80mm' | '58mm' = '80mm'): Promise<{ success: boolean; method: 'serial' | 'system'; message: string }> {
    // 1. Tentar imprimir diretamente na maquininha via Web Serial se conectada
    if (this.activeSerialPort && this.activeSerialPort.writable) {
      try {
        const payload = this.buildReceiptEscPos(data, paperWidth);
        const writer = this.activeSerialPort.writable.getWriter();
        await writer.write(payload);
        writer.releaseLock();
        return {
          success: true,
          method: 'serial',
          message: 'Talão impresso com sucesso na maquininha térmica!'
        };
      } catch (err: any) {
        console.warn('Erro ao transmitir para a porta serial, aplicando fallback de impressão:', err);
      }
    }

    // 2. Fallback de alta fidelidade: layout térmico (80mm/58mm)
    try {
      document.body.classList.add('printing-thermal');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-thermal');
      }, 500);

      return {
        success: true,
        method: 'system',
        message: 'Impressão térmica enviada para a impressora de talões!'
      };
    } catch (err: any) {
      return {
        success: false,
        method: 'system',
        message: err?.message || 'Falha ao acionar a impressão.'
      };
    }
  }

  // Teste de impressão na maquininha
  public async printTestSlip(): Promise<{ success: boolean; message: string }> {
    const testData: HardwareReceiptData = {
      companyName: 'Masakula ERP & PDV',
      nif: '5417082910',
      invoiceNumber: 'TESTE-HARDWARE-001',
      date: new Date().toLocaleString('pt-AO'),
      operatorName: 'Teste de Comunicação',
      customerName: 'Consumidor Final',
      items: [
        {
          name: 'Comunicação Maquininha Térmica',
          quantity: 1,
          price: 0,
          subtotal: 0
        }
      ],
      subtotal: 0,
      total: 0,
      paymentMethod: 'Teste Físico ESC/POS'
    };

    const res = await this.printReceipt(testData);
    return {
      success: res.success,
      message: res.method === 'serial' 
        ? 'Talão de teste enviado via porta serial para a maquininha!' 
        : 'Diálogo de impressão térmica acionado com sucesso!'
    };
  }
}

export const hardwareService = new HardwareIntegrationService();
export default hardwareService;
