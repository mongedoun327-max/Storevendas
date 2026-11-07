export interface SavedPrinterInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

const PRINTER_STORAGE_KEY = "worscoi_pos_printer_info";

function readSavedPrinterInfo(): SavedPrinterInfo | null {
  try {
    const savedInfoStr = localStorage.getItem(PRINTER_STORAGE_KEY);
    return savedInfoStr ? JSON.parse(savedInfoStr) as SavedPrinterInfo : null;
  } catch {
    localStorage.removeItem(PRINTER_STORAGE_KEY);
    return null;
  }
}

/**
 * Procura uma porta previamente autorizada ou solicita autorização se não existir.
 */
export async function getOrReconnectSerialPort(): Promise<SerialPort> {
  if (typeof navigator === "undefined" || !("serial" in navigator)) {
    throw new Error("A Web Serial API não é suportada neste navegador.");
  }

  // Verifica Permissions Policy para evitar exceção de restrição em iframe
  if (typeof document !== "undefined" && "permissionsPolicy" in document) {
    try {
      const policy = (document as any).permissionsPolicy;
      if (typeof policy?.allowsFeature === "function" && !policy.allowsFeature("serial")) {
        throw new Error(
          "O acesso à porta serial está bloqueado por política de segurança no iframe. Abra a aplicação num novo separador para conectar a impressora térmica física via USB/Serial."
        );
      }
    } catch (policyErr: any) {
      if (policyErr?.message?.includes("separador")) throw policyErr;
    }
  }

  let authorizedPorts: SerialPort[] = [];
  try {
    authorizedPorts = await (navigator as any).serial.getPorts();
  } catch (err: any) {
    if (
      err?.name === "SecurityError" ||
      err?.message?.toLowerCase().includes("permissions policy") ||
      err?.message?.toLowerCase().includes("disallowed")
    ) {
      throw new Error(
        "Acesso à porta serial indisponível na pré-visualização (iframe). Abra a aplicação num novo separador para aceder ao hardware USB/Serial."
      );
    }
    throw err;
  }

  const savedInfo = readSavedPrinterInfo();
  let targetPort: SerialPort | undefined;

  if (authorizedPorts.length > 0 && savedInfo) {
    targetPort = authorizedPorts.find((port) => {
      const info = port.getInfo();
      return info.usbVendorId === savedInfo.usbVendorId
        && info.usbProductId === savedInfo.usbProductId;
    });
  }

  if (!targetPort && authorizedPorts.length > 0) {
    targetPort = authorizedPorts[0];
  }

  if (!targetPort) {
    try {
      targetPort = await (navigator as any).serial.requestPort();
    } catch (err: any) {
      if (
        err?.name === "SecurityError" ||
        err?.message?.toLowerCase().includes("permissions policy") ||
        err?.message?.toLowerCase().includes("disallowed")
      ) {
        throw new Error(
          "Acesso à porta serial bloqueado por política de segurança no iframe. Abra a aplicação num novo separador."
        );
      }
      throw err;
    }
  }

  if (!targetPort) {
    throw new Error("Nenhuma porta serial selecionada.");
  }

  const info = targetPort.getInfo();
  if (info.usbVendorId !== undefined && info.usbProductId !== undefined) {
    localStorage.setItem(
      PRINTER_STORAGE_KEY,
      JSON.stringify({
        usbVendorId: info.usbVendorId,
        usbProductId: info.usbProductId,
      } satisfies SavedPrinterInfo)
    );
  }

  if (!targetPort.writable) {
    await targetPort.open({ baudRate: 9600 });
  }

  return targetPort;
}

/**
 * Envia um buffer ESC/POS usando a porta recuperada automaticamente.
 */
export async function printSilentESCPOSToSerial(data: Uint8Array): Promise<void> {
  const port = await getOrReconnectSerialPort();
  const writer = port.writable?.getWriter();

  if (!writer) {
    throw new Error("Não foi possível obter o fluxo de escrita da porta serial.");
  }

  try {
    await writer.write(data);
  } finally {
    writer.releaseLock();
  }
}
