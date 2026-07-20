import { IconExternalLink } from "@tabler/icons-react";
import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
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

const STATUS_FILTERS: (TicketStatus | "all")[] = ["all", "open", "resolved", "closed"];

// Umbrales del gesto de arrastre sobre el "handle" superior: bajar poco
// contrae (si estaba expandida), bajar bastante cierra, subir expande.
const CLOSE_DRAG_THRESHOLD = 70;
const COLLAPSE_DRAG_THRESHOLD = 45;
const EXPAND_DRAG_THRESHOLD = 45;
const CLOSE_DRAG_MAX_TRANSLATE = 160;

function isOpenStatus(status: TicketStatus): boolean {
  return status === "open";
}

export function DetailDrawer({ site, tickets, onClose }: DetailDrawerProps) {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [expanded, setExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    setStatusFilter("all");
    setExpanded(false);
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

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartY.current = event.clientY;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    setDragY(event.clientY - dragStartY.current);
  };

  const endDrag = () => {
    if (dragStartY.current === null) return;
    const delta = dragY;
    dragStartY.current = null;
    setDragging(false);
    setDragY(0);

    if (delta > CLOSE_DRAG_THRESHOLD) {
      onClose();
    } else if (delta > COLLAPSE_DRAG_THRESHOLD && expanded) {
      setExpanded(false);
    } else if (delta < -EXPAND_DRAG_THRESHOLD) {
      setExpanded(true);
    }
  };

  if (!site) return null;

  return (
    <div
      className={`glass-panel fixed bottom-5 left-5 right-[320px] z-[15] flex flex-col overflow-hidden px-5 pb-4 pt-1.5 transition-all duration-200 ease-out ${
        expanded ? "max-h-[75vh]" : "max-h-[300px]"
      }`}
      style={
        dragging
          ? {
              transform: `translateY(${Math.max(0, Math.min(dragY, CLOSE_DRAG_MAX_TRANSLATE))}px)`,
              opacity: dragY > 0 ? Math.max(1 - dragY / 220, 0.4) : 1,
              transition: "none",
            }
          : undefined
      }
    >
      <div
        className="-mx-5 mb-2 flex shrink-0 cursor-grab touch-none justify-center py-1 active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label="Deslizar para expandir o cerrar"
        role="separator"
      >
        <span className="h-1 w-10 rounded-full bg-white/15" />
      </div>

      <div className="mb-3 flex shrink-0 items-baseline justify-between gap-3">
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

      <div className="mb-3 flex shrink-0 flex-wrap gap-1">
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

      <div className="thin-scroll grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
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
                  ticket.priority === "urgente" ? "var(--red)" : "var(--blue)",
              }}
            >
              {ticket.osTicketUrl ? (
                <a
                  href={ticket.osTicketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-2 inline-flex items-start gap-1 text-xs text-[color:var(--text)] hover:text-[color:var(--cyan)] hover:underline"
                  title="Ver ticket en osTicket"
                >
                  {ticket.subject}
                  <IconExternalLink size={11} stroke={2} className="mt-0.5 flex-shrink-0" />
                </a>
              ) : (
                <p className="line-clamp-2 text-xs text-[color:var(--text)]">{ticket.subject}</p>
              )}
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
              <p className="mono-label mt-1 truncate text-[9px] text-[color:var(--muted-2)]">
                Tema: {ticket.helpTopic}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
