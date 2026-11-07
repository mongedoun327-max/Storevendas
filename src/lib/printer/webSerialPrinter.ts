interface RawSerialWriter {
  write(data: Uint8Array): Promise<void>;
  releaseLock(): void;
}

interface RawSerialPort {
  writable?: {
    getWriter(): RawSerialWriter;
  };
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

interface RawSerialNavigator {
  serial: {
    requestPort(): Promise<RawSerialPort>;
  };
}

export async function printRawEscPos(
  data: Uint8Array,
  baudRate: number = 9600
): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serial" in navigator)) {
    if (typeof window !== "undefined") {
      window.alert("O seu navegador não suporta a Web Serial API. Utilize o Google Chrome ou Microsoft Edge.");
    }
    return false;
  }

  const serialNavigator = navigator as any;
  let port: any;
  let writer: RawSerialWriter | undefined;
  let isOpen = false;

  try {
    port = await serialNavigator.serial.requestPort();
    if (!port) return false;
    await port.open({ baudRate });
    isOpen = true;

    writer = port.writable?.getWriter();
    if (!writer) {
      throw new Error("Não foi possível obter o fluxo de escrita da porta serial.");
    }

    await writer.write(data);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") {
      console.log("Impressão cancelada pelo utilizador.");
    } else {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro na impressão via Web Serial:", error);
      if (typeof window !== "undefined") {
        window.alert(`Falha na comunicação com a impressora: ${message}`);
      }
    }
    return false;
  } finally {
    writer?.releaseLock();
    if (port && isOpen) {
      try {
        await port.close();
      } catch (error) {
        console.warn("Erro ao fechar a porta serial:", error);
      }
    }
  }
}
