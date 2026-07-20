import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const ADMIN_COOKIE_NAME = "admin_token";
const SESSION_DURATION = "8h";

interface AdminEnv {
  username: string;
  passwordHash: string;
  jwtSecret: string;
}

/**
 * Lee la config de admin recién en cada request (no al arrancar el
 * proceso): así, si todavía no se configuró ADMIN_USERNAME/
 * ADMIN_PASSWORD_HASH/JWT_SECRET en este servidor, el resto de la API
 * (pública, sin login) sigue funcionando normal — solo /api/admin/* queda
 * inutilizable hasta que se complete el .env.
 */
function readAdminEnv(): AdminEnv | null {
  const { ADMIN_USERNAME, ADMIN_PASSWORD_HASH, JWT_SECRET } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !JWT_SECRET) return null;
  return { username: ADMIN_USERNAME, passwordHash: ADMIN_PASSWORD_HASH, jwtSecret: JWT_SECRET };
}

export function getAdminEnvOrThrow(): AdminEnv {
  const env = readAdminEnv();
  if (!env) {
    throw new Error(
      "Admin no configurado: faltan ADMIN_USERNAME/ADMIN_PASSWORD_HASH/JWT_SECRET en backend/.env"
    );
  }
  return env;
}

export function signAdminToken(username: string, jwtSecret: string): string {
  return jwt.sign({ sub: username, role: "admin" }, jwtSecret, { expiresIn: SESSION_DURATION });
}

function verifyAdminToken(token: string, jwtSecret: string): boolean {
  try {
    const payload = jwt.verify(token, jwtSecret);
    return typeof payload === "object" && payload?.role === "admin";
  } catch {
    return false;
  }
}

/** Protege cualquier ruta /api/admin/* (menos login) — exige cookie httpOnly con JWT válido. */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const env = readAdminEnv();
  if (!env) {
    res.status(500).json({ error: "Admin no configurado en este servidor." });
    return;
  }

  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token || !verifyAdminToken(token, env.jwtSecret)) {
    res.status(401).json({ error: "No autenticado." });
    return;
  }

  next();
}
