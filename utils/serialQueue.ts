export class SerialQueueManager {
  private static instance: SerialQueueManager;
  private port: SerialPort | null = null;
  private queue: Promise<void> = Promise.resolve();
  private baudRate = 9600;

  private constructor() {}

  public static getInstance(): SerialQueueManager {
    if (!SerialQueueManager.instance) {
      SerialQueueManager.instance = new SerialQueueManager();
    }
    return SerialQueueManager.instance;
  }

  /** Obtém ou reutiliza a porta serial sem abrir uma conexão já aberta. */
  private async getOpenPort(): Promise<SerialPort> {
    if (typeof navigator === "undefined" || !("serial" in navigator)) {
      throw new Error("A Web Serial API não é suportada neste navegador.");
    }

    if (this.port?.writable) {
      return this.port;
    }

    let ports: SerialPort[] = [];
    try {
      ports = await (navigator as any).serial.getPorts();
    } catch (err: any) {
      if (
        err?.name === "SecurityError" ||
        err?.message?.toLowerCase().includes("permissions policy") ||
        err?.message?.toLowerCase().includes("disallowed")
      ) {
        throw new Error(
          "Acesso à porta serial bloqueado por política de segurança no iframe. Abra a aplicação num novo separador para usar a impressora física."
        );
      }
      throw err;
    }

    if (!ports || ports.length === 0) {
      throw new Error("Nenhuma impressora autorizada. Configure a impressora primeiro.");
    }

    this.port = ports[0];

    if (!this.port.writable) {
      try {
        await this.port.open({ baudRate: this.baudRate });
      } catch (error) {
        if (!(error instanceof Error) || !error.message.toLowerCase().includes("already open")) {
          throw error;
        }
      }
    }

    return this.port;
  }

  /** Adiciona uma impressão ao final da fila assíncrona. */
  public enqueuePrint(data: Uint8Array): Promise<void> {
    const task = this.queue.then(() => this.executePrintTask(data));
    this.queue = task.catch((error) => {
      console.error("Erro no processamento da tarefa da fila:", error);
    });

    return task;
  }

  private async executePrintTask(data: Uint8Array): Promise<void> {
    const port = await this.getOpenPort();
    const writer = port.writable?.getWriter();

    if (!writer) {
      throw new Error("A porta serial não está pronta para escrita.");
    }

    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  /** Encerra com segurança a conexão serial. */
  public async closePort(): Promise<void> {
    if (!this.port) return;

    const port = this.port;
    this.port = null;

    if (port.writable) {
      try {
        await port.close();
      } catch (error) {
        console.warn("Erro ao fechar a porta:", error);
      }
    }
  }
}
