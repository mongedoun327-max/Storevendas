"use client";

import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, HardDriveUpload } from "lucide-react";
import { db } from "@/lib/db/posDatabase";
import { syncPendingSalesBatch } from "@/services/offlineSyncService";

export function SyncStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const pendingCount = useLiveQuery(
    () => db.pendingSales.where("synced").equals(0).count(),
    [],
    0
  );

  const handleManualSync = async (): Promise<void> => {
    if (typeof navigator === "undefined" || !navigator.onLine || isSyncing) return;

    try {
      setIsSyncing(true);
      await syncPendingSalesBatch();
    } catch (error) {
      console.error("Erro ao sincronizar manualmente:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      void handleManualSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex select-none items-center gap-2.5 rounded-2xl border px-3.5 py-1.5 text-xs font-bold shadow-lg transition-all duration-300 ${
          !isOnline
            ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
            : pendingCount > 0
              ? "border-[#E1FB15]/40 bg-[#E1FB15]/10 text-[#E1FB15]"
              : "border-[#32D583]/30 bg-[#32D583]/10 text-[#32D583]"
        }`}
      >
        <div className="relative flex items-center justify-center">
          {!isOnline ? (
            <WifiOff className="h-4 w-4 text-rose-400" />
          ) : pendingCount > 0 ? (
            <HardDriveUpload className="h-4 w-4 animate-pulse text-[#E1FB15]" />
          ) : (
            <Wifi className="h-4 w-4 text-[#32D583]" />
          )}
          <span
            className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${
              !isOnline
                ? "animate-ping bg-rose-500"
                : pendingCount > 0
                  ? "animate-ping bg-[#E1FB15]"
                  : "bg-[#32D583]"
            }`}
          />
        </div>

        <div className="flex flex-col">
          {!isOnline ? (
            <span>
              Modo Offline {pendingCount > 0 && <span className="font-extrabold text-white">({pendingCount} em espera)</span>}
            </span>
          ) : pendingCount > 0 ? (
            <span>{pendingCount} {pendingCount === 1 ? "venda pendente" : "vendas pendentes"}</span>
          ) : (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sincronizado
            </span>
          )}
        </div>
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          type="button"
          onClick={() => void handleManualSync()}
          disabled={isSyncing}
          title="Forçar sincronização com o servidor"
          aria-label="Sincronizar vendas pendentes"
          className="flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-[#181818] px-3 text-xs font-bold text-white transition hover:bg-white/10 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#E1FB15] ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "A Enviar..." : "Sincronizar"}</span>
        </button>
      )}
    </div>
  );
}
