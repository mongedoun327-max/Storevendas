"use client";

import React from "react";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { PWAInstallButton } from "./PWAInstallButton";

export function POSHeader({ operatorName }: { operatorName: string }) {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#131313] px-6 text-white">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-extrabold tracking-wider text-white">
          WORSCOI<span className="text-[#E1FB15]">.POS</span>
        </h1>
        <span className="text-xs text-gray-500">| Operador: {operatorName}</span>
      </div>

      <div className="flex items-center gap-3">
        <PWAInstallButton className="bg-white/10 hover:bg-white/20 text-white border-white/20" />
        <SyncStatusBadge />
      </div>
    </header>
  );
}
