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
    const KEY_THRESHOLD_MS = 80; // Intervalo rápido característico de lasers e leitores de código de barras
    const ENTER_THRESHOLD_MS = 450; // Intervalo tolerado para o Enter final enviado pelo leitor

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      // 1. Enter final do leitor de código de barras
      if (e.key === 'Enter') {
        const trimmed = buffer.trim();
        // A maioria dos códigos de fábrica (EAN-13, EAN-8, UPC, Code128) tem >= 3 caracteres
        if (trimmed.length >= 3 && diff <= ENTER_THRESHOLD_MS) {
          if (!isInput) {
            e.preventDefault();
          }
          this.handleScannedBarcode(trimmed);
        }
        buffer = '';
        return;
      }

      // 2. Se o tempo entre teclas normais for maior que o limiar do leitor, reinicia buffer
      if (diff > KEY_THRESHOLD_MS && buffer.length > 0) {
        buffer = '';
      }

      // 3. Captura caracteres imprimíveis do scanner
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

  private escapeHtml(str: string): string {
    return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // Gera o HTML estilizado em padrão térmico de 80mm ou 58mm
  public renderReceiptHtml(data: HardwareReceiptData, paperWidth: '80mm' | '58mm' = '80mm'): string {
    const widthCss = paperWidth === '58mm' ? '54mm' : '76mm';
    const itemsHtml = data.items
      .map(
        item => `
        <tr>
          <td style="padding: 3px 0; text-align: left; vertical-align: top;">
            <div style="font-weight: 600;">${this.escapeHtml(item.name)}</div>
            <div style="font-size: 10px; color: #444;">${item.quantity} x ${item.price.toLocaleString('pt-AO')} Kz</div>
          </td>
          <td style="padding: 3px 0; text-align: right; font-weight: bold; vertical-align: top;">
            ${item.subtotal.toLocaleString('pt-AO')} Kz
          </td>
        </tr>
      `
      )
      .join('');

    return `
      <div id="printable-thermal-receipt" style="width: ${widthCss}; margin: 0 auto; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.25; color: #000; background: #fff; padding: 4mm;">
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
          <h2 style="margin: 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">${this.escapeHtml(data.companyName)}</h2>
          <div style="font-size: 10px; font-weight: bold;">NIF: ${this.escapeHtml(data.nif || 'Consumidor Final')}</div>
        </div>
        <div style="font-size: 10px; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
          <div><b>TALÃO/FATURA:</b> ${this.escapeHtml(data.invoiceNumber)}</div>
          <div><b>DATA:</b> ${this.escapeHtml(data.date)}</div>
          <div><b>OPERADOR:</b> ${this.escapeHtml(data.operatorName)}</div>
          <div><b>CLIENTE:</b> ${this.escapeHtml(data.customerName || 'Consumidor Final')}</div>
          ${data.customerNif ? `<div><b>NIF CLIENTE:</b> ${this.escapeHtml(data.customerNif)}</div>` : ''}
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
          <thead>
            <tr style="border-bottom: 1px solid #000; font-size: 10px;">
              <th style="text-align: left; padding-bottom: 3px;">QTD x ARTIGO</th>
              <th style="text-align: right; padding-bottom: 3px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <span>Subtotal:</span>
            <span>${data.subtotal.toLocaleString('pt-AO')} Kz</span>
          </div>
          ${data.discount ? `
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #444;">
            <span>Desconto:</span>
            <span>-${data.discount.toLocaleString('pt-AO')} Kz</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin: 4px 0;">
            <span>TOTAL:</span>
            <span>${data.total.toLocaleString('pt-AO')} Kz</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <span>Pagamento:</span>
            <span>${this.escapeHtml(data.paymentMethod)}</span>
          </div>
          ${data.amountPaid ? `
          <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <span>Entregue:</span>
            <span>${data.amountPaid.toLocaleString('pt-AO')} Kz</span>
          </div>` : ''}
          ${data.changeGiven ? `
          <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <span>Troco:</span>
            <span>${data.changeGiven.toLocaleString('pt-AO')} Kz</span>
          </div>` : ''}
        </div>
        <div style="text-align: center; font-size: 9px; line-height: 1.3;">
          <p style="margin: 0; font-weight: bold;">Obrigado pela preferência!</p>
          <p style="margin: 2px 0 0 0; font-size: 8px;">Processado por programa certificado • Software Masakula PDV</p>
        </div>
      </div>
    `;
  }

  // Imprime de forma limpa via iframe invisível ou container DOM garantido
  private printHtmlContent(htmlContent: string): void {
    if (typeof window === 'undefined') return;

    // 1. Atualiza ou injeta elemento estático na página para compatibilidade com @media print
    let container = document.getElementById('printable-thermal-receipt-dynamic');
    if (!container) {
      container = document.createElement('div');
      container.id = 'printable-thermal-receipt-dynamic';
      document.body.appendChild(container);
    }
    container.innerHTML = htmlContent;

    // 2. Tenta impressão limpa via iframe dedicado sem popup
    try {
      let iframe = document.getElementById('thermal-print-iframe') as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'thermal-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <title>Talão Térmico</title>
              <style>
                @page { size: auto; margin: 0mm; }
                body { margin: 0; padding: 0; background: #fff; }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
          } catch {
            window.print();
          }
        }, 250);
        return;
      }
    } catch {
      // Fallback padrão se iframe for restrito
    }

    document.body.classList.add('printing-thermal');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-thermal');
    }, 500);
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

    // 2. Fallback de alta fidelidade: layout térmico (80mm/58mm) renderizado e impresso sem falhas
    try {
      const receiptHtml = this.renderReceiptHtml(data, paperWidth);
      this.printHtmlContent(receiptHtml);

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
  public async printTestSlip(paperWidth: '80mm' | '58mm' = '80mm'): Promise<{ success: boolean; message: string }> {
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
          price: 1500,
          subtotal: 1500
        },
        {
          name: 'Teste de Corte e Alinhamento',
          quantity: 1,
          price: 0,
          subtotal: 0
        }
      ],
      subtotal: 1500,
      total: 1500,
      paymentMethod: 'Teste Físico ESC/POS'
    };

    const res = await this.printReceipt(testData, paperWidth);
    return {
      success: res.success,
      message: res.method === 'serial' 
        ? 'Talão de teste enviado via porta serial para a maquininha!' 
        : 'Talão de teste enviado com sucesso para a impressora térmica!'
    };
  }
}

export const hardwareService = new HardwareIntegrationService();
export default hardwareService;
