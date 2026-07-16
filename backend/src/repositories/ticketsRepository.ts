import {
  Ticket,
  TicketFilters,
  TicketPriority,
  TicketStats,
  TicketStatus,
} from "../types";
import { getAllTickets, isOpenStatus } from "../data/store";
import { sitesRepository } from "./sitesRepository";

const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "critical"];
const TREND_DAYS = 30;

/**
 * Capa de acceso a datos de tickets. Hoy lee del store en memoria (mock);
 * al migrar a osTicket real, reemplazar InMemoryTicketsRepository por una
 * implementación que consulte MySQL, manteniendo esta misma interfaz para
 * que rutas de Express y frontend no requieran cambios.
 */
export interface TicketsRepository {
  findAll(filters?: TicketFilters): Ticket[];
  getStats(): TicketStats;
}

function matchesFilters(ticket: Ticket, filters: TicketFilters): boolean {
  if (filters.siteId && ticket.siteId !== filters.siteId) return false;
  if (filters.status && ticket.status !== filters.status) return false;
  if (filters.priority && ticket.priority !== filters.priority) return false;
  return true;
}

function isToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function dateKey(isoDate: string): string {
  return isoDate.slice(0, 10); // YYYY-MM-DD
}

class InMemoryTicketsRepository implements TicketsRepository {
  findAll(filters: TicketFilters = {}): Ticket[] {
    return getAllTickets().filter((ticket) => matchesFilters(ticket, filters));
  }

  getStats(): TicketStats {
    const tickets = getAllTickets();
    const sites = sitesRepository.findAll();

    const byStatus = STATUSES.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<TicketStatus, number>);

    const byPriority = PRIORITIES.reduce((acc, priority) => {
      acc[priority] = 0;
      return acc;
    }, {} as Record<TicketPriority, number>);

    const bySiteMap = new Map<
      string,
      { total: number; open: number; criticalOpen: number }
    >();
    sites.forEach((site) => bySiteMap.set(site.id, { total: 0, open: 0, criticalOpen: 0 }));

    let totalOpen = 0;
    let totalCritical = 0;
    let resolvedToday = 0;

    const trendMap = new Map<string, number>();
    for (let i = 0; i < TREND_DAYS; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendMap.set(dateKey(d.toISOString()), 0);
    }

    for (const ticket of tickets) {
      byStatus[ticket.status] += 1;
      byPriority[ticket.priority] += 1;

      const siteEntry = bySiteMap.get(ticket.siteId);
      if (siteEntry) {
        siteEntry.total += 1;
        if (isOpenStatus(ticket.status)) {
          siteEntry.open += 1;
          if (ticket.priority === "critical") siteEntry.criticalOpen += 1;
        }
      }

      if (isOpenStatus(ticket.status)) {
        totalOpen += 1;
        if (ticket.priority === "critical") totalCritical += 1;
      }

      if (ticket.status === "resolved" && isToday(ticket.updatedAt)) {
        resolvedToday += 1;
      }

      const key = dateKey(ticket.createdAt);
      if (trendMap.has(key)) {
        trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
      }
    }

    const bySite = sites.map((site) => {
      const entry = bySiteMap.get(site.id) ?? { total: 0, open: 0, criticalOpen: 0 };
      return {
        siteId: site.id,
        siteName: site.name,
        total: entry.total,
        open: entry.open,
        criticalOpen: entry.criticalOpen,
      };
    });

    const trend = Array.from(trendMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, count]) => ({ date, count }));

    return {
      total: tickets.length,
      byStatus,
      byPriority,
      bySite,
      totalOpen,
      totalCritical,
      resolvedToday,
      trend,
    };
  }
}

export const ticketsRepository: TicketsRepository = new InMemoryTicketsRepository();
