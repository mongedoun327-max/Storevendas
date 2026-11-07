import { BadgeVariant } from "./Badge";

export type ServiceOrderStatus =
  | "OPEN"
  | "DIAGNOSING"
  | "AWAITING_PARTS"
  | "IN_REPAIR"
  | "READY_FOR_PICKUP"
  | "DELIVERED"
  | "CANCELLED";

export interface ServiceOrderStateSpec {
  badgeLabel: string;
  badgeVariant: BadgeVariant;
  progressPercent: number;
  primaryActionLabel: string | null;
}

export const SERVICE_ORDER_FSM: Record<ServiceOrderStatus, ServiceOrderStateSpec> = {
  OPEN: {
    badgeLabel: "Aberta",
    badgeVariant: "neutral",
    progressPercent: 10,
    primaryActionLabel: "Iniciar diagnóstico",
  },
  DIAGNOSING: {
    badgeLabel: "Em diagnóstico",
    badgeVariant: "neutral",
    progressPercent: 30,
    primaryActionLabel: "Registar diagnóstico",
  },
  AWAITING_PARTS: {
    badgeLabel: "Aguardando peças",
    badgeVariant: "neutral",
    progressPercent: 45,
    primaryActionLabel: "Retomar reparação",
  },
  IN_REPAIR: {
    badgeLabel: "Em reparação",
    badgeVariant: "neutral",
    progressPercent: 65,
    primaryActionLabel: "Concluir reparação",
  },
  READY_FOR_PICKUP: {
    badgeLabel: "Pronta para entrega",
    badgeVariant: "neutral",
    progressPercent: 90,
    primaryActionLabel: "Registar entrega ao cliente",
  },
  DELIVERED: {
    badgeLabel: "Concluída e entregue",
    badgeVariant: "success",
    progressPercent: 100,
    primaryActionLabel: null,
  },
  CANCELLED: {
    badgeLabel: "Cancelada",
    badgeVariant: "neutral",
    progressPercent: 0,
    primaryActionLabel: null,
  },
};
