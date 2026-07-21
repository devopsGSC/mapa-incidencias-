import { useCallback, useMemo, useState } from "react";
import { fetchSites, fetchTickets } from "../api/client";
import { computeStats } from "../lib/computeStats";
import { playTicketChime } from "../lib/notificationSound";
import { Site, Ticket } from "../types";
import { useSocket } from "./useSocket";

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
  ticket: Ticket;
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
      playTicketChime(incoming.priority);
      setNotifications((prev) => {
        const entry: TicketNotification = { id: `${incoming.id}-${Date.now()}`, ticket: incoming };
        return [...prev, entry].slice(-MAX_VISIBLE_NOTIFICATIONS);
      });
    },
    [upsertTicket]
  );

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
    onSync: loadFullState,
  });

  const stats = useMemo(
    () => computeStats(state.tickets, state.sites),
    [state.tickets, state.sites]
  );

  return { ...state, connected, stats, notifications, dismissNotification };
}
