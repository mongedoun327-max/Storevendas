"use client";

import { useState } from "react";
import { SerialQueueManager } from "@/utils/serialQueue";

export function useQueuedPrinter() {
  const [isProcessing, setIsProcessing] = useState(false);

  const print = async (buffer: Uint8Array): Promise<void> => {
    setIsProcessing(true);
    try {
      const printerQueue = SerialQueueManager.getInstance();
      await printerQueue.enqueuePrint(buffer);
    } catch (error) {
      console.error("Falha ao enviar para a fila de impressão:", error);
      const message = error instanceof Error
        ? error.message
        : "Erro na comunicação com a impressora.";
      window.alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return { print, isProcessing };
}
