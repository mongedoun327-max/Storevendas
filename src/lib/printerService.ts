/**
 * Serviço de Impressão Térmica ESC/POS via WebUSB e Web Serial API
 * Suporta impressoras térmicas padrão de 80mm e 58mm
 */

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptData {
  companyName: string;
  nif: string;
  saleId: string;
  operatorName: string;
  items: ReceiptItem[];
  total: number;
  paymentMethod: string;
}

/**
 * Constrói payload binário ESC/POS formatado para 80mm (48 colunas)
 */
export function buildEscPosPayload(data: ReceiptData): Uint8Array {
  const buffer: number[] = [];

  // Comandos ESC/POS
  const ESC = 0x1b;
  const GS = 0x1d;

  // Inicializar impressora (ESC @)
  buffer.push(ESC, 0x40);

  // Alinhamento Centralizado (ESC a 1)
  buffer.push(ESC, 0x61, 0x01);

  // Negrito Ativado (ESC E 1)
  buffer.push(ESC, 0x45, 0x01);
  // Tamanho Dobrado (GS ! 0x11)
  buffer.push(GS, 0x21, 0x11);
  addString(buffer, data.companyName + '\n');

  // Tamanho Normal
  buffer.push(GS, 0x21, 0x00);
  buffer.push(ESC, 0x45, 0x00);
  addString(buffer, `NIF: ${data.nif}\n`);
  addString(buffer, '------------------------------------------------\n');

  // Alinhamento à Esquerda (ESC a 0)
  buffer.push(ESC, 0x61, 0x00);
  addString(buffer, `Venda: #${data.saleId.slice(0, 8)}\n`);
  addString(buffer, `Operador: ${data.operatorName}\n`);
  addString(buffer, `Data: ${new Date().toLocaleString('pt-AO')}\n`);
  addString(buffer, '------------------------------------------------\n');

  // Itens
  for (const item of data.items) {
    const itemLeft = `${item.qty}x ${item.name}`;
    const itemRight = `${(item.qty * item.price).toFixed(2)} Kz`;
    const spaceWidth = Math.max(1, 48 - itemLeft.length - itemRight.length);
    const line = itemLeft + ' '.repeat(spaceWidth) + itemRight + '\n';
    addString(buffer, line);
  }

  addString(buffer, '------------------------------------------------\n');

  // Negrito para Total
  buffer.push(ESC, 0x45, 0x01);
  const totalLeft = 'TOTAL:';
  const totalRight = `${data.total.toFixed(2)} Kz`;
  const totalSpaces = Math.max(1, 48 - totalLeft.length - totalRight.length);
  addString(buffer, totalLeft + ' '.repeat(totalSpaces) + totalRight + '\n');
  buffer.push(ESC, 0x45, 0x00);

  addString(buffer, `Metodo: ${data.paymentMethod}\n`);
  addString(buffer, '------------------------------------------------\n');

  // Mensagem Final Centralizada
  buffer.push(ESC, 0x61, 0x01);
  addString(buffer, 'Obrigado pela preferencia!\n');
  addString(buffer, 'Software Masakula ERP & PDV\n\n\n');

  // Cortar Papel (GS V 66 0)
  buffer.push(GS, 0x56, 0x42, 0x00);

  return new Uint8Array(buffer);
}

function addString(buffer: number[], text: string) {
  // Converte texto em bytes compatíveis com ASCII / CodePage 860
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Substituições básicas de acentos para compatibilidade com impressoras térmicas
    if (code > 127) {
      const char = text[i];
      const map: Record<string, number> = {
        'á': 0xa0, 'à': 0x85, 'ã': 0xc6, 'â': 0x83, 'é': 0x82, 'ê': 0x88,
        'í': 0xa1, 'ó': 0xa2, 'ô': 0x93, 'õ': 0xe4, 'ú': 0xa3, 'ç': 0x87,
        'Á': 0x41, 'À': 0x41, 'Ã': 0x41, 'Â': 0x41, 'É': 0x90, 'Ê': 0x45,
        'Í': 0x49, 'Ó': 0x4f, 'Ô': 0x4f, 'Õ': 0x4f, 'Ú': 0x55, 'Ç': 0x80
      };
      buffer.push(map[char] || 0x20);
    } else {
      buffer.push(code);
    }
  }
}

/**
 * Envia o buffer binário diretamente para a impressora via WebUSB
 */
export async function printReceiptWebUSB(data: ReceiptData): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !('usb' in navigator)) {
      console.warn('WebUSB API não é suportada neste navegador ou ambiente.');
      return false;
    }

    const payload = buildEscPosPayload(data);

    // Solicitar dispositivo USB (filtros comuns de classe de impressora USB ou aberto)
    const device = await (navigator as any).usb.requestDevice({
      filters: []
    });

    if (!device) return false;

    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    // Procura a interface com endpoint OUT
    let outEndpointNumber = 1;
    let interfaceNumber = 0;

    for (const iface of device.configuration.interfaces) {
      for (const alt of iface.alternates) {
        for (const ep of alt.endpoints) {
          if (ep.direction === 'out') {
            outEndpointNumber = ep.endpointNumber;
            interfaceNumber = iface.interfaceNumber;
            break;
          }
        }
      }
    }

    await device.claimInterface(interfaceNumber);
    await device.transferOut(outEndpointNumber, payload);
    await device.close();

    return true;
  } catch (error) {
    console.warn('Falha na impressão direta WebUSB (esperado se não houver impressora USB pareada):', error);
    return false;
  }
}

// Comando ESC/POS: Pulse pin 2 (ESC p 0 25 250)
export const ESC_POS_DRAWER_KICK = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);

/**
 * Aciona a abertura da gaveta de dinheiro (Cash Drawer) via comando ESC/POS por WebUSB
 */
export async function triggerCashDrawer(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !('usb' in navigator)) {
      console.warn('WebUSB API não é suportada neste navegador ou ambiente.');
      return false;
    }

    // 1. Reutilizar dispositivo previamente autorizado ou solicitar nova conexão
    const devices = await (navigator as any).usb.getDevices();
    let device = devices[0];

    if (!device) {
      device = await (navigator as any).usb.requestDevice({ filters: [] });
    }

    if (!device) return false;

    if (!device.opened) {
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      try {
        await device.claimInterface(0);
      } catch {
        // Interface já reivindicada ou ocupada
      }
    }

    // 2. Localiza o endpoint de saída de dados (OUT Endpoint)
    let outEndpointNumber = 1;
    if (device.configuration && device.configuration.interfaces) {
      const endpoint = device.configuration.interfaces[0]?.alternate?.endpoints?.find(
        (e: any) => e.direction === 'out'
      );
      if (endpoint) {
        outEndpointNumber = endpoint.endpointNumber;
      }
    }

    await device.transferOut(outEndpointNumber, ESC_POS_DRAWER_KICK);
    return true;
  } catch (error) {
    console.error('Erro ao enviar comando de abertura da gaveta:', error);
    return false;
  }
}

