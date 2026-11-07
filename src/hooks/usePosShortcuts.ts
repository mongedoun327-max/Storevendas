"use client";

import { useEffect, useCallback } from "react";
import { triggerCashDrawer } from "@/lib/drawerService";

export interface UsePosShortcutsOptions {
  onOpenDrawerSuccess?: () => void;
  onOpenDrawerError?: () => void;
  enabled?: boolean;
}

export function usePosShortcuts({
  onOpenDrawerSuccess,
  onOpenDrawerError,
  enabled = true,
}: UsePosShortcutsOptions = {}) {
  const handleOpenDrawer = useCallback(async () => {
    const success = await triggerCashDrawer();
    if (success) {
      onOpenDrawerSuccess?.();
    } else {
      onOpenDrawerError?.();
    }
  }, [onOpenDrawerSuccess, onOpenDrawerError]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Captura F9 (Code "F9" ou Key "F9")
      if (event.key === "F9" || event.code === "F9") {
        event.preventDefault(); // Impede comportamentos padrão do SO/Navegador
        event.stopPropagation();
        
        handleOpenDrawer();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, handleOpenDrawer]);

  return { handleOpenDrawer };
}

export default usePosShortcuts;
