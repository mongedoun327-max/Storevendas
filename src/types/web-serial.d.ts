interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialPort {
  writable: WritableStream<Uint8Array> | null;
  readable: ReadableStream<Uint8Array> | null;
  getInfo(): SerialPortInfo;
  open(options: { baudRate: number; [key: string]: unknown }): Promise<void>;
  close(): Promise<void>;
}

interface Serial extends EventTarget {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: unknown): Promise<SerialPort>;
  addEventListener(
    type: "connect" | "disconnect" | string,
    listener: (event: Event) => void
  ): void;
  removeEventListener(
    type: "connect" | "disconnect" | string,
    listener: (event: Event) => void
  ): void;
}

interface Navigator {
  serial?: Serial;
}
