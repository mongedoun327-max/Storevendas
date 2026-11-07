"use client";

import { useEffect, useState } from "react";

/**
 * Verifica se a funcionalidade 'serial' é permitida pela política de permissões atual
 */
function isSerialAllowed(): boolean {
  if (typeof navigator === "undefined" || !("serial" in navigator)) {
    return false;
  }

  // Verifica a Permissions Policy do documento, se disponível
  if (typeof document !== "undefined" && "permissionsPolicy" in document) {
    try {
      const policy = (document as any).permissionsPolicy;
      if (typeof policy?.allowsFeature === "function") {
        if (!policy.allowsFeature("serial")) {
          return false;
        }
      }
    } catch {
      // Caso o nome 'serial' não seja reconhecido pelo navegador atual, prossegue
    }
  }

  return true;
}

export function useSerialStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isSerialAllowed()) {
      return;
    }

    const serial = (navigator as any).serial;
    if (!serial) return;

    let isActive = true;

    const checkConnection = async () => {
      try {
        const ports = await serial.getPorts();
        if (ports && ports.length > 0) {
          console.log("Impressora configurada e pronta para impressão instantânea!");
        }
        if (isActive) {
          setIsConnected(Boolean(ports && ports.length > 0));
        }
      } catch (error: any) {
        // Ignora silenciosamente erros de política de permissões (ex.: iframes no AI Studio ou navegadores restritos)
        const isPermissionDisallowed =
          error?.name === "SecurityError" ||
          error?.message?.toLowerCase().includes("permissions policy") ||
          error?.message?.toLowerCase().includes("disallowed");

        if (isPermissionDisallowed) {
          if (isActive) {
            setIsConnected(false);
          }
          return;
        }

        console.warn("Aviso ao verificar impressoras seriais:", error?.message || error);
        if (isActive) {
          setIsConnected(false);
        }
      }
    };

    void checkConnection();

    const handleConnect = (event: Event) => {
      console.log("Impressora ligada via USB:", event);
      setIsConnected(true);
    };

    const handleDisconnect = (event: Event) => {
      console.log("Impressora desligada:", event);
      void checkConnection();
    };

    try {
      serial.addEventListener("connect", handleConnect);
      serial.addEventListener("disconnect", handleDisconnect);
    } catch {
      // Proteção se addEventListener falhar em contextos com restrições
    }

    return () => {
      isActive = false;
      try {
        serial.removeEventListener("connect", handleConnect);
        serial.removeEventListener("disconnect", handleDisconnect);
      } catch {
        // Ignora
      }
    };
  }, []);

  return { isConnected };
}

