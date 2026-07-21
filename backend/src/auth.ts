import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "./types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { username: string; role: Role };
    }
  }
}

export const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION = "8h";

interface SessionPayload {
  sub: string;
  role: Role;
}

function getJwtSecretOrThrow(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Falta JWT_SECRET en backend/.env");
  }
  return secret;
}

export function signSessionToken(username: string, role: Role): string {
  return jwt.sign({ sub: username, role }, getJwtSecretOrThrow(), { expiresIn: SESSION_DURATION });
}

function verifySessionToken(token: string): { username: string; role: Role } | null {
  try {
    const payload = jwt.verify(token, getJwtSecretOrThrow());
    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof (payload as SessionPayload).sub !== "string" ||
      ((payload as SessionPayload).role !== "admin" && (payload as SessionPayload).role !== "normal")
    ) {
      return null;
    }
    const { sub, role } = payload as SessionPayload;
    return { username: sub, role };
  } catch {
    return null;
  }
}

/** Exige sesión válida (cualquier rol). Adjunta req.user. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const session = token ? verifySessionToken(token) : null;
  if (!session) {
    res.status(401).json({ error: "No autenticado." });
    return;
  }
  req.user = session;
  next();
}

/** Exige sesión válida Y que el rol esté en la lista permitida. */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    const session = token ? verifySessionToken(token) : null;
    if (!session) {
      res.status(401).json({ error: "No autenticado." });
      return;
    }
    if (!roles.includes(session.role)) {
      res.status(403).json({ error: "No autorizado para este recurso." });
      return;
    }
    req.user = session;
    next();
  };
}

/** Verifica el token de sesión "a mano" (fuera del ciclo request/response de Express) — lo usa el middleware de socket.io. */
export function verifySessionTokenRaw(token: string): { username: string; role: Role } | null {
  return verifySessionToken(token);
}
