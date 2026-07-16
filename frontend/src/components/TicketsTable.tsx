import { useMemo, useState } from "react";
import { DepartmentIcon } from "../lib/departmentIcons";
import {
  formatDateTime,
  PRIORITY_DOT_COLORS,
  PRIORITY_LABELS,
  STATUS_DOT_COLORS,
  STATUS_LABELS,
} from "../lib/labels";
import { Site, Ticket, TicketPriority, TicketStatus } from "../types";

interface TicketsTableProps {
  tickets: Ticket[];
  sites: Site[];
}

const PAGE_SIZE = 25;

const selectClasses =
  "rounded-md border border-[color:var(--glass-border)] bg-[#0b1220] px-2 py-1 text-xs text-[color:var(--text)]";

export function TicketsTable({ tickets, sites }: TicketsTableProps) {
  const [siteId, setSiteId] = useState<string>("all");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [priority, setPriority] = useState<TicketPriority | "all">("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const siteNameById = useMemo(() => {
    const map = new Map<string, string>();
    sites.forEach((site) => map.set(site.id, site.name));
    return map;
  }, [sites]);

  const filtered = useMemo(() => {
    return tickets
      .filter((ticket) => (siteId === "all" ? true : ticket.siteId === siteId))
      .filter((ticket) => (status === "all" ? true : ticket.status === status))
      .filter((ticket) => (priority === "all" ? true : ticket.priority === priority))
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [tickets, siteId, status, priority]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="glass-panel">
      <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--glass-border)] p-3">
        <h3 className="mono-label mr-2 text-[11px] text-[color:var(--muted)]">
          Tickets recientes
        </h3>

        <select
          value={siteId}
          onChange={(event) => {
            setSiteId(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className={selectClasses}
        >
          <option value="all">Todos los sitios</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as TicketStatus | "all");
            setVisibleCount(PAGE_SIZE);
          }}
          className={selectClasses}
        >
          <option value="all">Todos los estados</option>
          {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(event) => {
            setPriority(event.target.value as TicketPriority | "all");
            setVisibleCount(PAGE_SIZE);
          }}
          className={selectClasses}
        >
          <option value="all">Todas las prioridades</option>
          {(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((value) => (
            <option key={value} value={value}>
              {PRIORITY_LABELS[value]}
            </option>
          ))}
        </select>

        <span className="mono-label ml-auto text-[10px] text-[color:var(--muted)]">
          {filtered.length} ticket{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="mono-label border-b border-[color:var(--glass-border)] text-[10px] text-[color:var(--muted)]">
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Asunto</th>
              <th className="px-3 py-2 font-medium">Sitio</th>
              <th className="px-3 py-2 font-medium">Depto.</th>
              <th className="min-w-[110px] px-3 py-2 font-medium">Estado</th>
              <th className="min-w-[110px] px-3 py-2 font-medium">Prioridad</th>
              <th className="px-3 py-2 font-medium">Solicitante</th>
              <th className="px-3 py-2 font-medium">Creado</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((ticket) => (
              <tr
                key={ticket.id}
                className="border-b border-white/[0.04] hover:bg-white/[0.03]"
              >
                <td className="px-3 py-2 font-mono text-xs text-[color:var(--muted)]">
                  {ticket.id}
                </td>
                <td className="max-w-xs truncate px-3 py-2 text-[color:var(--text)]">
                  {ticket.subject}
                </td>
                <td className="px-3 py-2 text-[color:var(--muted)]">
                  {siteNameById.get(ticket.siteId) ?? ticket.siteId}
                </td>
                <td className="px-3 py-2 text-[color:var(--muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <DepartmentIcon department={ticket.department} size={13} />
                    {ticket.department}
                  </span>
                </td>
                <td className="min-w-[110px] px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: STATUS_DOT_COLORS[ticket.status] }}
                    />
                    <span className="text-[13px] text-[color:var(--muted)]">
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </span>
                </td>
                <td className="min-w-[110px] px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: PRIORITY_DOT_COLORS[ticket.priority] }}
                    />
                    <span className="text-[13px] text-[color:var(--muted)]">
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2 text-[color:var(--muted)]">{ticket.requester}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-[color:var(--muted)]">
                  {formatDateTime(ticket.createdAt)}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-[color:var(--muted)]"
                >
                  No hay tickets que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {visibleCount < filtered.length && (
        <div className="border-t border-[color:var(--glass-border)] p-3 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="mono-label rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[10px] text-[color:var(--text)] transition-colors hover:bg-white/[0.1]"
          >
            Ver más
          </button>
        </div>
      )}
    </div>
  );
}
