export type TicketStatus = "open" | "resolved" | "closed";

export type Role = "admin" | "normal";

export interface CurrentUser {
  username: string;
  role: Role;
}

/** Fila de la tabla de usuarios del panel admin — a diferencia de CurrentUser (la sesión propia, sin email porque el JWT no lo lleva), esta sí incluye email. */
export interface AdminUserSummary {
  username: string;
  email: string;
  role: Role;
  /** Array vacío = sin restricción, ve todos los departamentos. */
  allowedDepartments: string[];
}

export type TicketPriority = "low" | "normal" | "high" | "urgente";

export type SiteType =
  | "aduana_terrestre"
  | "aduana_maritima"
  | "aduana_aerea"
  | "sede";

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  department: string;
  helpTopic: string;
  /** Equipo asignado (ost_team) — cruza departamentos, no es un hijo de department. "Sin equipo" si no tiene. */
  team: string;
  siteId: string;
  createdAt: string;
  updatedAt: string;
  /** Vencimiento efectivo de SLA (duedate si está seteado a mano, si no est_duedate calculado por osTicket según el SLA asignado). null si el ticket no tiene ninguno de los dos. */
  slaDueAt: string | null;
  requester: string;
  /** Link al detalle del ticket en el panel real de osTicket. Ausente si OSTICKET_BASE_URL no está configurada. */
  osTicketUrl?: string;
}

export interface Site {
  id: string;
  name: string;
  type: SiteType;
  lat: number;
  lng: number;
}

export interface SiteStat {
  siteId: string;
  siteName: string;
  total: number;
  open: number;
  urgenteOpen: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TicketStats {
  total: number;
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
  bySite: SiteStat[];
  totalOpen: number;
  totalUrgente: number;
  resolvedToday: number;
  trend: TrendPoint[];
}

export interface TicketFilters {
  siteId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
}
