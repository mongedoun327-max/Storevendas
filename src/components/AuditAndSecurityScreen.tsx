import React from 'react';
import { Info } from 'lucide-react';

export default function AuditAndSecurityScreen() {
  return (
    <section className="w-full">
      <div role="note" className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
        <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700" />
        <p className="text-sm leading-5">
          O histórico de auditoria ainda não está ligado aos registos do sistema. Não use este painel para confirmar operações.
        </p>
      </div>
    </section>
  );
}

export interface AuditLog {
  id: string;
  action: string;
  user_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export { AuditAndSecurityScreen };