import { useEffect, useMemo, useState } from "react";
import { DepartmentIcon } from "../lib/departmentIcons";
import {
  PRIORITY_BADGE_CLASSES,
  PRIORITY_LABELS,
  SITE_TYPE_LABELS,
  STATUS_LABELS,
} from "../lib/labels";
import { Site, Ticket, TicketStatus } from "../types";

interface DetailDrawerProps {
  site: Site | null;
  tickets: Ticket[];
  onClose: () => void;
}

const STATUS_FILTERS: (TicketStatus | "all")[] = [
  "all",
  "open",
  "in_progress",
  "resolved",
  "closed",
];

function isOpenStatus(status: TicketStatus): boolean {
  return status === "open" || status === "in_progress";
}

export function DetailDrawer({ site, tickets, onClose }: DetailDrawerProps) {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");

  useEffect(() => {
    setStatusFilter("all");
  }, [site?.id]);

  const siteTickets = useMemo(() => {
    if (!site) return [];
    const filtered = tickets.filter((t) => t.siteId === site.id);
    return statusFilter === "all"
      ? filtered
      : filtered.filter((t) => t.status === statusFilter);
  }, [tickets, site, statusFilter]);

  const openCount = useMemo(() => {
    if (!site) return 0;
    return tickets.filter((t) => t.siteId === site.id && isOpenStatus(t.status)).length;
  }, [tickets, site]);

  if (!site) return null;

  return (
    <div className="glass-panel fixed bottom-5 left-5 right-[320px] z-[15] max-h-[300px] overflow-hidden px-5 py-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display truncate text-lg font-semibold text-[color:var(--text)]">
            {site.name}
          </p>
          <p className="mono-label text-[10.5px] text-[color:var(--muted)]">
            {SITE_TYPE_LABELS[site.type].toUpperCase()} · {openCount} TICKETS ABIERTOS
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 rounded-md border border-[color:var(--glass-border)] px-2.5 py-1 text-[11px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--text)]"
        >
          Cerrar
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`mono-label rounded-full px-2.5 py-1 text-[10px] transition-colors ${
              statusFilter === status
                ? "bg-[#1A294C] text-[#7099FF]"
                : "text-[color:var(--muted)] hover:text-[color:var(--text)]"
            }`}
          >
            {status === "all" ? "TODOS" : STATUS_LABELS[status].toUpperCase()}
          </button>
        ))}
      </div>

      <div className="thin-scroll grid max-h-[160px] grid-cols-1 gap-2.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {siteTickets.length === 0 ? (
          <p className="col-span-full py-6 text-center text-sm text-[color:var(--muted)]">
            No hay tickets para este filtro.
          </p>
        ) : (
          siteTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-r-lg border border-[color:var(--glass-border)] border-l-[3px] bg-white/[0.03] px-3 py-2.5"
              style={{
                borderLeftColor:
                  ticket.priority === "critical" ? "var(--red)" : "var(--blue)",
              }}
            >
              <p className="line-clamp-2 text-xs text-[color:var(--text)]">{ticket.subject}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={`mono-label rounded px-1.5 py-0.5 text-[9px] font-semibold ${PRIORITY_BADGE_CLASSES[ticket.priority]}`}
                >
                  {PRIORITY_LABELS[ticket.priority].toUpperCase()}
                </span>
                <p className="mono-label flex items-center gap-1 text-[9.5px] text-[color:var(--muted)]">
                  <DepartmentIcon department={ticket.department} size={11} />
                  #{ticket.id} · {ticket.department}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
