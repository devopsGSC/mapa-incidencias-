import { useCallback, useMemo, useRef, useState } from "react";
import { fetchSites, fetchTickets } from "../api/client";
import { computeStats } from "../lib/computeStats";
import { playTicketChime } from "../lib/notificationSound";
import { Site, Ticket, TicketStatus } from "../types";
import { StatusChangedPayload, useSocket } from "./useSocket";

interface DashboardState {
  sites: Site[];
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastEventAt: Date | null;
  lastHeartbeatAt: Date | null;
}

export interface TicketNotification {
  id: string;
  kind: "new" | "status_changed";
  ticket: Ticket;
  /** Solo para kind === "status_changed" — el estado que tenía antes del cambio. */
  previousStatus?: TicketStatus;
}

const MAX_VISIBLE_NOTIFICATIONS = 4;

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    sites: [],
    tickets: [],
    loading: true,
    error: null,
    connected: false,
    lastEventAt: null,
    lastHeartbeatAt: null,
  });
  const [notifications, setNotifications] = useState<TicketNotification[]>([]);

  // Necesario para leer el estado más reciente desde handlers registrados
  // una sola vez en el socket (useSocket los toma con deps [] y los conserva
  // vía handlersRef) — sin esto, handleStatusChanged vería siempre los
  // tickets de la primera carga.
  const stateRef = useRef(state);
  stateRef.current = state;

  const upsertTicket = useCallback((incoming: Ticket) => {
    setState((prev) => {
      const exists = prev.tickets.some((t) => t.id === incoming.id);
      const tickets = exists
        ? prev.tickets.map((t) => (t.id === incoming.id ? incoming : t))
        : [incoming, ...prev.tickets];
      return { ...prev, tickets, lastEventAt: new Date() };
    });
  }, []);

  const handleTicketNew = useCallback(
    (incoming: Ticket) => {
      upsertTicket(incoming);
      playTicketChime();
      setNotifications((prev) => {
        const entry: TicketNotification = { id: `${incoming.id}-${Date.now()}`, kind: "new", ticket: incoming };
        return [...prev, entry].slice(-MAX_VISIBLE_NOTIFICATIONS);
      });
    },
    [upsertTicket]
  );

  /**
   * Ticket que cambió de estado, según el log de eventos real de osTicket
   * (ver ticketEventsPoller.ts en el backend) — no el poll normal de
   * tickets. Con el volumen actual, un cierre/resolución se perdía entre
   * ticket:updated sin que nadie lo notara; esto le da su propia
   * notificación, con el mismo sonido que un ticket nuevo.
   */
  const handleStatusChanged = useCallback(({ ticketId, status }: StatusChangedPayload) => {
    const existing = stateRef.current.tickets.find((t) => t.id === ticketId);
    // Sin el ticket en memoria todavía, o la sync normal ya se adelantó y
    // dejó el mismo estado: no hay nada nuevo que avisar.
    if (!existing || existing.status === status) return;

    const updatedTicket: Ticket = { ...existing, status };
    playTicketChime();
    setState((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
      lastEventAt: new Date(),
    }));
    setNotifications((prev) => {
      const entry: TicketNotification = {
        id: `${ticketId}-status-${Date.now()}`,
        kind: "status_changed",
        ticket: updatedTicket,
        previousStatus: existing.status,
      };
      return [...prev, entry].slice(-MAX_VISIBLE_NOTIFICATIONS);
    });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleHeartbeat = useCallback(() => {
    setState((prev) => ({ ...prev, lastHeartbeatAt: new Date() }));
  }, []);

  /**
   * Pide el estado completo (sitios + tickets) desde cero. Se llama tanto en
   * la conexión inicial como en cada reconexión (ver onSync en useSocket):
   * el socket nunca reenvía eventos perdidos durante un corte, así que la
   * única forma de no quedar desincronizado tras una reconexión es siempre
   * volver a traer todo, no solo confiar en los eventos incrementales.
   */
  const loadFullState = useCallback(() => {
    Promise.all([fetchSites(), fetchTickets()])
      .then(([sites, tickets]) => {
        setState((prev) => ({ ...prev, sites, tickets, loading: false, error: null }));
      })
      .catch((error: Error) => {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
      });
  }, []);

  const { connected } = useSocket({
    onTicketNew: handleTicketNew,
    onTicketUpdated: upsertTicket,
    onHeartbeat: handleHeartbeat,
    onStatusChanged: handleStatusChanged,
    onSync: loadFullState,
  });

  const stats = useMemo(
    () => computeStats(state.tickets, state.sites),
    [state.tickets, state.sites]
  );

  return { ...state, connected, stats, notifications, dismissNotification };
}
