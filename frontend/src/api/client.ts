import { Site, Ticket, TicketFilters, TicketStats } from "../types";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar ${path}`);
  }
  return response.json() as Promise<T>;
}

export function fetchSites(): Promise<Site[]> {
  return getJson<Site[]>("/api/sites");
}

export function fetchTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters.siteId) params.set("siteId", filters.siteId);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  const query = params.toString();
  return getJson<Ticket[]>(`/api/tickets${query ? `?${query}` : ""}`);
}

export function fetchTicketStats(): Promise<TicketStats> {
  return getJson<TicketStats>("/api/tickets/stats");
}
