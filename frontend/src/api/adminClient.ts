import { credentialedRequest } from "./client";
import { AdminUserSummary, Role, Site, SiteType } from "../types";

function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return credentialedRequest<T>(`/api/admin${path}`, init);
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

export function fetchUsers(): Promise<AdminUserSummary[]> {
  return adminRequest<AdminUserSummary[]>("/users");
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: Role;
}

export function createUser(payload: CreateUserPayload): Promise<AdminUserSummary> {
  return adminRequest<AdminUserSummary>("/users", { method: "POST", body: JSON.stringify(payload) });
}

export function setUserRole(username: string, role: Role): Promise<AdminUserSummary> {
  return adminRequest<AdminUserSummary>(`/users/${encodeURIComponent(username)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function resetUserPassword(username: string, password: string): Promise<{ ok: true }> {
  return adminRequest(`/users/${encodeURIComponent(username)}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function deleteUser(username: string): Promise<{ ok: true }> {
  return adminRequest(`/users/${encodeURIComponent(username)}`, { method: "DELETE" });
}
