"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { offlineDb } from "@/lib/db/offlineDb";
import { syncPendingSales } from "@/services/offlineSyncService";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const pendingCount = useLiveQuery(
    () => offlineDb.sales.where("synced").equals(0).count(),
    []
  ) ?? 0;

  const triggerSync = async (): Promise<void> => {
    if (typeof navigator === "undefined" || !navigator.onLine || syncingRef.current) {
      return;
    }

    syncingRef.current = true;
    setIsSyncing(true);
    try {
      await syncPendingSales();
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      void triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      void triggerSync();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    triggerSync,
  };
}
