import { Ticket, TicketPriority } from "../types";

export interface DepartmentCount {
  department: string;
  count: number;
}

export type PriorityPresence = Record<TicketPriority, boolean>;

function isOpenStatus(status: Ticket["status"]): boolean {
  return status === "open";
}

function groupTicketsBySite(tickets: Ticket[]): Map<string, Ticket[]> {
  const bySite = new Map<string, Ticket[]>();
  for (const ticket of tickets) {
    const list = bySite.get(ticket.siteId);
    if (list) list.push(ticket);
    else bySite.set(ticket.siteId, [ticket]);
  }
  return bySite;
}

function departmentCounts(tickets: Ticket[]): DepartmentCount[] {
  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    counts.set(ticket.department, (counts.get(ticket.department) ?? 0) + 1);
  }
  return Array.from(counts, ([department, count]) => ({ department, count })).sort(
    (a, b) => b.count - a.count
  );
}

/**
 * Desglose de departamentos por sitio, usado para armar el marcador
 * compuesto del mapa: para cada sitio, la lista de departamentos con
 * tickets *abiertos* (status open), ordenada de mayor a menor cantidad.
 * Si un sitio no tiene tickets abiertos, cae al departamento históricamente
 * más frecuente en ese sitio (para no dejar el marcador sin ícono).
 */
export function computeSiteDepartmentBreakdown(tickets: Ticket[]): Map<string, DepartmentCount[]> {
  const result = new Map<string, DepartmentCount[]>();
  for (const [siteId, siteTickets] of groupTicketsBySite(tickets)) {
    const openCounts = departmentCounts(siteTickets.filter((t) => isOpenStatus(t.status)));
    if (openCounts.length > 0) {
      result.set(siteId, openCounts);
    } else {
      result.set(siteId, departmentCounts(siteTickets).slice(0, 1));
    }
  }
  return result;
}

/**
 * Presencia (sí/no) de cada prioridad entre los tickets *abiertos* de cada
 * sitio — usado para pintar el aro segmentado en 4 cuadrantes del marcador
 * (uno por prioridad). No es proporcional a la cantidad de tickets, solo
 * indica si esa prioridad tiene al menos un ticket abierto en el sitio.
 */
export function computeSitePriorityPresence(tickets: Ticket[]): Map<string, PriorityPresence> {
  const result = new Map<string, PriorityPresence>();
  for (const [siteId, siteTickets] of groupTicketsBySite(tickets)) {
    const presence: PriorityPresence = { low: false, normal: false, high: false, urgente: false };
    for (const ticket of siteTickets) {
      if (isOpenStatus(ticket.status)) {
        presence[ticket.priority] = true;
      }
    }
    result.set(siteId, presence);
  }
  return result;
}
