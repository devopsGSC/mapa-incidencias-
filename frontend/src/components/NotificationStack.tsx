import { useEffect, useMemo, useRef, useState } from "react";
import { TicketNotification } from "../hooks/useDashboardData";
import { DepartmentIcon } from "../lib/departmentIcons";
import { PRIORITY_LABELS, STATUS_CHART_COLORS, STATUS_LABELS } from "../lib/labels";
import { Site, TicketPriority } from "../types";

interface NotificationStackProps {
  notifications: TicketNotification[];
  sites: Site[];
  onDismiss: (id: string) => void;
}

const VISIBLE_DURATION_MS = 12000;
const EXIT_DURATION_MS = 300;

const PRIORITY_BORDER: Record<TicketPriority, string> = {
  urgente: "var(--red)",
  high: "var(--amber)",
  normal: "var(--blue)",
  low: "var(--muted-2)",
};

/** Banner "ticket entrante"/"cambio de estado": aparece con ticket:new o ticket:status_changed y se auto-oculta a los pocos segundos. */
export function NotificationStack({ notifications, sites, onDismiss }: NotificationStackProps) {
  const siteNameById = useMemo(() => {
    const map = new Map<string, string>();
    sites.forEach((site) => map.set(site.id, site.name));
    return map;
  }, [sites]);

  if (notifications.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-[320px] top-[90px] z-[25] flex w-full max-w-xl flex-col gap-3 px-4">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          siteName={siteNameById.get(notification.ticket.siteId) ?? notification.ticket.siteId}
          onDismiss={() => onDismiss(notification.id)}
        />
      ))}
    </div>
  );
}

interface ToastProps {
  notification: TicketNotification;
  siteName: string;
  onDismiss: () => void;
}

function Toast({ notification, siteName, onDismiss }: ToastProps) {
  const { ticket, kind, previousStatus } = notification;
  const [visible, setVisible] = useState(false);
  const removeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const exitTimer = setTimeout(() => close(), VISIBLE_DURATION_MS);

    function close() {
      setVisible(false);
      removeTimer.current = setTimeout(onDismiss, EXIT_DURATION_MS);
    }

    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualClose = () => {
    clearTimeout(removeTimer.current);
    setVisible(false);
    removeTimer.current = setTimeout(onDismiss, EXIT_DURATION_MS);
  };

  const isStatusChange = kind === "status_changed";
  const borderColor = isStatusChange ? STATUS_CHART_COLORS[ticket.status] : PRIORITY_BORDER[ticket.priority];
  const label = isStatusChange ? `Cambio de estado · ${ticket.id}` : `Nuevo ticket · ${ticket.id}`;
  const metaLine = isStatusChange
    ? `${siteName} · ${previousStatus ? `${STATUS_LABELS[previousStatus]} → ` : ""}${STATUS_LABELS[ticket.status]}`
    : `${siteName} · ${PRIORITY_LABELS[ticket.priority]}`;

  return (
    <div
      className={`glass-panel pointer-events-auto flex items-start gap-4 border-l-[5px] px-6 py-5 shadow-2xl transition-all duration-300 ease-out ${
        visible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
      }`}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="mt-0.5 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
        <DepartmentIcon department={ticket.department} size={28} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mono-label text-sm" style={{ color: isStatusChange ? borderColor : "var(--cyan)" }}>
          {label}
        </p>
        {ticket.osTicketUrl ? (
          <a
            href={ticket.osTicketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 line-clamp-2 block text-xl font-medium text-[color:var(--text)] hover:text-[color:var(--cyan)] hover:underline"
            title="Ver ticket en osTicket"
          >
            {ticket.subject}
          </a>
        ) : (
          <p className="mt-1 line-clamp-2 text-xl font-medium text-[color:var(--text)]">
            {ticket.subject}
          </p>
        )}
        <p className="mono-label mt-1.5 text-sm text-[color:var(--muted)]">{metaLine}</p>
      </div>
      <button
        type="button"
        onClick={handleManualClose}
        className="flex-shrink-0 text-lg text-[color:var(--muted)] transition-colors hover:text-[color:var(--text)]"
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  );
}
