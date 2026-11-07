/**
 * Formata um valor em cêntimos (inteiro) para o padrão canónico Masakula:
 * Exemplo: formatKwanzaFromCents(226850000) -> "2 268 500,00 Kz"
 */
export function formatKwanzaFromCents(
  amountInCents: number,
  options?: { showPlusSign?: boolean }
): string {
  if (!Number.isFinite(amountInCents)) {
    return "0,00\u00A0Kz";
  }

  const isNegative = amountInCents < 0;
  const absoluteCents = Math.abs(Math.round(amountInCents));
  const integerPart = Math.floor(absoluteCents / 100);
  const decimalPart = String(absoluteCents % 100).padStart(2, "0");

  const formattedInteger = integerPart
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");

  const signPrefix = isNegative
    ? "-\u00A0"
    : options?.showPlusSign && amountInCents > 0
      ? "+\u00A0"
      : "";

  return `${signPrefix}${formattedInteger},${decimalPart}\u00A0Kz`;
}

/**
 * Formata um valor monetário em Kwanzas para o padrão oficial Masakula v2.0
 */
export function formatKwanza(
  amount: number,
  options?: { showPlusSign?: boolean }
): string {
  if (!Number.isFinite(amount)) return "0,00\u00A0Kz";
  return formatKwanzaFromCents(Math.round(amount * 100), options);
}

/**
 * Format numerical values into Angolan Kwanza currency (Kz)
 */
export function formatKz(amount: number, options?: { showPlusSign?: boolean }): string {
  return formatKwanza(amount, options);
}

/**
 * Format numbers without currency symbol
 */
export function formatNumber(val: number): string {
  return new Intl.NumberFormat('pt-AO').format(val);
}

/**
 * Format ISO date string into readable Portuguese date format (DD/MM/YYYY)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format ISO date string into time (HH:mm)
 */
export function formatTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format ISO date string into date and time (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Configuração de estado para Ordens de Serviço (FSM Masakula v2.0)
 */
export function getWorkOrderStatusConfig(status: string) {
  switch (status) {
    case 'completed':
    case 'delivered':
      return { 
        label: 'Concluída e entregue', 
        variant: 'success' as const,
        progress: 100,
        nextAction: null,
      };
    case 'ready':
    case 'ready_for_pickup':
      return { 
        label: 'Pronta para entrega', 
        variant: 'neutral' as const,
        progress: 90,
        nextAction: 'Registar entrega ao cliente',
      };
    case 'in_progress':
      return { 
        label: 'Em reparação', 
        variant: 'neutral' as const,
        progress: 65,
        nextAction: 'Concluir reparação',
      };
    case 'waiting_parts':
      return { 
        label: 'Aguardando peças', 
        variant: 'neutral' as const,
        progress: 45,
        nextAction: 'Retomar reparação',
      };
    case 'diagnosing':
      return { 
        label: 'Em diagnóstico', 
        variant: 'neutral' as const,
        progress: 30,
        nextAction: 'Submeter orçamento',
      };
    case 'pending':
    case 'open':
      return { 
        label: 'Aberta', 
        variant: 'neutral' as const,
        progress: 10,
        nextAction: 'Iniciar diagnóstico',
      };
    case 'canceled':
      return { 
        label: 'Cancelada', 
        variant: 'neutral' as const,
        progress: 0,
        nextAction: null,
      };
    default:
      return { 
        label: status, 
        variant: 'neutral' as const,
        progress: 50,
        nextAction: 'Visualizar',
      };
  }
}

/**
 * Configuração de prioridade para Ordens de Serviço (Masakula v2.0)
 */
export function getPriorityConfig(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return { label: 'Urgente', variant: 'danger' as const, visible: true };
    case 'high':
      return { label: 'Alta', variant: 'priority-high' as const, visible: true };
    case 'normal':
    case 'low':
    default:
      return { label: 'Normal', variant: 'neutral' as const, visible: false };
  }
}
