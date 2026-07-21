import { credentialedRequest, UnauthorizedError } from "./client";
import { CurrentUser } from "../types";

export { UnauthorizedError as AuthUnauthorizedError };

export function login(username: string, password: string): Promise<CurrentUser> {
  return credentialedRequest<CurrentUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logout(): Promise<{ ok: true }> {
  return credentialedRequest("/api/auth/logout", { method: "POST" });
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return credentialedRequest<CurrentUser>("/api/auth/me");
}

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return credentialedRequest("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
  return credentialedRequest("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}
