interface WebSerialWriter {
  write(data: Uint8Array): Promise<void>;
  releaseLock(): void;
}

interface WebSerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  writable?: {
    getWriter(): WebSerialWriter;
  };
}

interface WebSerialNavigator {
  serial: {
    requestPort(): Promise<WebSerialPort>;
  };
}

export async function printViaWebSerial(data: Uint8Array): Promise<void> {
  if (typeof navigator === "undefined" || !("serial" in navigator)) {
    throw new Error("A Web Serial API não é suportada neste navegador.");
  }

  const serialNavigator = navigator as any;
  let port: any;
  let writer: WebSerialWriter | undefined;

  try {
    port = await serialNavigator.serial.requestPort();
    if (!port) return;
    await port.open({ baudRate: 9600 });

    writer = port.writable?.getWriter();
    if (!writer) {
      throw new Error("Não foi possível obter o escritor da porta.");
    }

    await writer.write(data);
  } catch (error: any) {
    if (
      error?.name === "SecurityError" ||
      error?.message?.toLowerCase().includes("permissions policy") ||
      error?.message?.toLowerCase().includes("disallowed")
    ) {
      console.warn("Acesso serial bloqueado por política de permissões (iframe).");
      throw new Error(
        "Acesso à porta serial restrito no modo de pré-visualização (iframe). Abra a aplicação num novo separador para imprimir diretamente na impressora térmica física."
      );
    }
    console.error("Erro na impressão via Web Serial:", error);
    throw error;
  } finally {
    writer?.releaseLock();
    if (port) {
      await port.close();
    }
  }
}
