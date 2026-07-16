export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type TicketPriority = "low" | "normal" | "high" | "critical";

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
  siteId: string;
  createdAt: string;
  updatedAt: string;
  requester: string;
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
  criticalOpen: number;
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
  totalCritical: number;
  resolvedToday: number;
  trend: TrendPoint[];
}

export interface TicketFilters {
  siteId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
}
