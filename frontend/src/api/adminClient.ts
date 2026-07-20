import { Site, SiteType } from "../types";
import { API_BASE_URL } from "./client";

export class AdminUnauthorizedError extends Error {}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/admin${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (response.status === 401) {
    throw new AdminUnauthorizedError("No autenticado.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? `Error ${response.status} al consultar ${path}`);
  }
  return body as T;
}

export function adminLogin(username: string, password: string): Promise<{ ok: true }> {
  return adminRequest("/login", { method: "POST", body: JSON.stringify({ username, password }) });
}

export function adminLogout(): Promise<{ ok: true }> {
  return adminRequest("/logout", { method: "POST" });
}

export function fetchConfiguredSites(): Promise<Site[]> {
  return adminRequest<Site[]>("/sites");
}

export function fetchUnmappedSiteNames(): Promise<string[]> {
  return adminRequest<string[]>("/sites/unmapped");
}

export interface UpsertSitePayload {
  name: string;
  type: SiteType;
  lat: number;
  lng: number;
}

export function upsertSite(payload: UpsertSitePayload): Promise<Site> {
  return adminRequest<Site>("/sites", { method: "POST", body: JSON.stringify(payload) });
}

export function deleteSite(name: string): Promise<{ ok: true }> {
  return adminRequest(`/sites/${encodeURIComponent(name)}`, { method: "DELETE" });
}
