import { readOnlyQuery } from "../db";
import {
  Ticket,
  TicketFilters,
  TicketPriority,
  TicketStats,
  TicketStatus,
} from "../types";
import { sitesRepository } from "./sitesRepository";

const STATUSES: TicketStatus[] = ["open", "resolved", "closed"];
const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "critical"];
const TREND_DAYS = 30;

// osTicket: ost_ticket_status.id -> nuestro TicketStatus. Archivado(4) y
// Borrado(5) quedan fuera del dashboard (no relevantes para operación diaria).
const STATUS_ID_MAP: Record<number, TicketStatus> = {
  1: "open", // Abierto
  2: "resolved", // Resuelto
  3: "closed", // Cerrado
};
const RELEVANT_STATUS_IDS = Object.keys(STATUS_ID_MAP).join(",");

// ost_ticket__cdata.priority guarda el ID de ost_ticket_priority como texto
// ("1".."4"), no la palabra. El valor interno de "crítica" en la base es
// "emergency", no "critical" — acá se traduce al vocabulario que ya usa la UI.
const PRIORITY_ID_MAP: Record<number, TicketPriority> = {
  1: "low",
  2: "normal",
  3: "high",
  4: "critical", // DB: "emergency"
};

// Único lugar que sabe cuál es, dentro de nuestro vocabulario ya traducido
// (TicketPriority), el valor que cuenta como "crítico" para totalCritical y
// criticalOpen — así ambos cálculos quedan atados a la misma fuente en vez
// de repetir el literal "critical" en cada comparación.
const CRITICAL_PRIORITY: TicketPriority = "critical";

// Un par de nombres de departamento no calzan exactamente con el acento que
// usa la UI (ej. "Tecnologia" sin tilde en la base).
const DEPARTMENT_NAME_FIXES: Record<string, string> = {
  Tecnologia: "Tecnología",
};

function isOpenStatus(status: TicketStatus): boolean {
  return status === "open";
}

interface TicketRow {
  ticketId: number;
  statusId: number;
  created: string; // raw MySQL "YYYY-MM-DD HH:MM:SS" (ver dateStrings en db.ts)
  lastupdate: string | null;
  subject: string | null;
  priorityRaw: string | null;
  aduanaRaw: string | null;
  departmentName: string | null;
  requesterName: string | null;
}

/**
 * Convierte un DATETIME crudo de MySQL a ISO 8601. Verificado directamente
 * contra el servidor real (NOW()/UTC_TIMESTAMP() comparados en el mismo
 * instante contra el reloj de este proceso): la base guarda sus timestamps
 * ya en UTC, así que basta con marcarlos como tales — nunca dejamos que el
 * driver los reinterprete con la timezone local del proceso de Node (eso
 * fue justo la causa del bug de reenvío duplicado en el poller, y también
 * desfasaba 6h todas las fechas mostradas en la UI).
 */
function mysqlDatetimeToIso(raw: string): string {
  return new Date(`${raw.replace(" ", "T")}Z`).toISOString();
}

/**
 * Extrae el ID numérico inicial del texto libre de cdata.aduana, que en la
 * base real viene como "3,El Amatillo" o, en tickets más viejos, como solo
 * "6" (sin nombre). Nunca se confía en el nombre que venga en ese texto.
 */
function extractAduanaId(raw: string | null): number | null {
  if (!raw) return null;
  const match = /^(\d+)/.exec(raw.trim());
  return match ? Number(match[1]) : null;
}

/** IDs válidos de la lista oficial de sitios/aduanas (ost_list_items, list_id=2). */
async function loadValidAduanaIds(): Promise<Set<number>> {
  const rows = await readOnlyQuery<{ id: number }>(
    "SELECT id FROM ost_list_items WHERE list_id = 2"
  );
  return new Set(rows.map((row) => row.id));
}

function mapRow(row: TicketRow, validAduanaIds: Set<number>): Ticket {
  const aduanaId = extractAduanaId(row.aduanaRaw);
  const siteId = aduanaId !== null && validAduanaIds.has(aduanaId) ? String(aduanaId) : "";

  const priorityId = row.priorityRaw ? parseInt(row.priorityRaw, 10) : NaN;
  const priority = PRIORITY_ID_MAP[priorityId] ?? "normal";

  const departmentRaw = (row.departmentName ?? "").trim();
  const department = DEPARTMENT_NAME_FIXES[departmentRaw] ?? (departmentRaw || "Sin departamento");

  return {
    id: `TCK-${row.ticketId}`,
    subject: row.subject?.trim() || "(Sin asunto)",
    status: STATUS_ID_MAP[row.statusId] ?? "open",
    priority,
    department,
    siteId,
    createdAt: mysqlDatetimeToIso(row.created),
    updatedAt: mysqlDatetimeToIso(row.lastupdate ?? row.created),
    requester: row.requesterName?.trim() || "Desconocido",
  };
}

const TICKETS_SELECT = `
  SELECT
    t.ticket_id  AS ticketId,
    t.status_id  AS statusId,
    t.created    AS created,
    t.lastupdate AS lastupdate,
    cd.subject   AS subject,
    cd.priority  AS priorityRaw,
    cd.aduana    AS aduanaRaw,
    d.name       AS departmentName,
    u.name       AS requesterName
  FROM ost_ticket t
  LEFT JOIN ost_ticket__cdata cd ON cd.ticket_id = t.ticket_id
  LEFT JOIN ost_department d ON d.id = t.dept_id
  LEFT JOIN ost_user u ON u.id = t.user_id
  WHERE t.status_id IN (${RELEVANT_STATUS_IDS})
`;

async function fetchAllTickets(): Promise<Ticket[]> {
  const [rows, validAduanaIds] = await Promise.all([
    readOnlyQuery<TicketRow>(`${TICKETS_SELECT} ORDER BY t.created DESC`),
    loadValidAduanaIds(),
  ]);
  return rows.map((row) => mapRow(row, validAduanaIds));
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

/**
 * Capa de acceso a datos de tickets. Lee de la base real de osTicket
 * (solo lectura, vía readOnlyQuery) y traduce su esquema al modelo que ya
 * consume el frontend — rutas de Express y frontend no cambiaron.
 */
export interface TicketsRepository {
  findAll(filters?: TicketFilters): Promise<Ticket[]>;
  getStats(): Promise<TicketStats>;
}

class MySqlTicketsRepository implements TicketsRepository {
  async findAll(filters: TicketFilters = {}): Promise<Ticket[]> {
    const tickets = await fetchAllTickets();
    return tickets.filter((ticket) => matchesFilters(ticket, filters));
  }

  async getStats(): Promise<TicketStats> {
    const [tickets, sites] = await Promise.all([fetchAllTickets(), Promise.resolve(sitesRepository.findAll())]);

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
          if (ticket.priority === CRITICAL_PRIORITY) siteEntry.criticalOpen += 1;
        }
      }

      if (isOpenStatus(ticket.status)) {
        totalOpen += 1;
        if (ticket.priority === CRITICAL_PRIORITY) totalCritical += 1;
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

export const ticketsRepository: TicketsRepository = new MySqlTicketsRepository();

// Reutilizados por el poller de socket.io (sockets/liveSimulator.ts) para no
// duplicar la lógica de mapeo DB -> Ticket.
export { TICKETS_SELECT, mapRow as mapTicketRow, loadValidAduanaIds, mysqlDatetimeToIso };
export type { TicketRow };
