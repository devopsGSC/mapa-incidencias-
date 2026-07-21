import { Site, Ticket, TicketFilters, TicketStats } from "../types";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class UnauthorizedError extends Error {}

/**
 * Fetch autenticado (manda la cookie de sesión httpOnly) — reutilizado acá,
 * en authClient.ts y en adminClient.ts para no duplicar el manejo de 401 ni
 * el parseo de JSON.
 */
export async function credentialedRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (response.status === 401) {
    throw new UnauthorizedError("No autenticado.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? `Error ${response.status} al consultar ${path}`);
  }
  return body as T;
}

export function fetchSites(): Promise<Site[]> {
  return credentialedRequest<Site[]>("/api/sites");
}

export function fetchTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (filters.siteId) params.set("siteId", filters.siteId);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  const query = params.toString();
  return credentialedRequest<Ticket[]>(`/api/tickets${query ? `?${query}` : ""}`);
}

export function fetchTicketStats(): Promise<TicketStats> {
  return credentialedRequest<TicketStats>("/api/tickets/stats");
}
