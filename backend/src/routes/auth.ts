import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Router } from "express";
import { requireAuth, SESSION_COOKIE_NAME, signSessionToken } from "../auth";
import { sendPasswordResetEmail } from "../lib/mailer";
import { usersRepository } from "../repositories/usersRepository";

export const authRouter = Router();

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8h, igual que la expiración del JWT
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

authRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = (req.body ?? {}) as { username?: unknown; password?: unknown };
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "username y password son requeridos." });
      return;
    }

    const user = usersRepository.findByUsername(username);
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !passwordMatches) {
      res.status(401).json({ error: "Usuario o contraseña incorrectos." });
      return;
    }

    const token = signSessionToken(user.username, user.role);
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE_MS,
    });
    res.json({ username: user.username, role: user.role });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

// --- "¿Olvidaste tu contraseña?" — sin sesión, público -------------------

const FORGOT_PASSWORD_LIMIT = 5;
const FORGOT_PASSWORD_WINDOW_MS = 60 * 60 * 1000; // 1h
// Límite simple en memoria (alcanza para un panel interno de bajo tráfico;
// se resetea si el proceso reinicia, y eso está bien).
const forgotPasswordAttempts = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = forgotPasswordAttempts.get(ip);
  if (!entry || now - entry.windowStart > FORGOT_PASSWORD_WINDOW_MS) {
    forgotPasswordAttempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > FORGOT_PASSWORD_LIMIT;
}

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    if (isRateLimited(req.ip ?? "unknown")) {
      res.status(429).json({ error: "Demasiados intentos. Probá de nuevo más tarde." });
      return;
    }

    const { email } = (req.body ?? {}) as { email?: unknown };
    if (typeof email !== "string" || email.trim().length === 0) {
      res.status(400).json({ error: "email es requerido." });
      return;
    }

    const user = usersRepository.findByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      usersRepository.setResetToken(user.username, token, Date.now() + RESET_TOKEN_TTL_MS);
      // "Fire and forget" a propósito: nunca se espera el envío real antes de
      // responder. Awaitear el roundtrip SMTP de Gmail solo para el caso
      // "el correo existe" haría que esa respuesta tardara sistemáticamente
      // más que la del caso "no existe" — justo el tipo de fuga por timing
      // que este endpoint tiene que evitar.
      sendPasswordResetEmail(user.email, token).catch((error) => {
        console.error("[auth] no se pudo enviar el correo de recuperación:", (error as Error).message);
      });
    }

    // Mismo mensaje, misma forma de respuesta, exista o no el usuario.
    res.json({ message: "Si el correo existe en nuestro sistema, vas a recibir instrucciones para restablecer tu contraseña." });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = (req.body ?? {}) as { token?: unknown; newPassword?: unknown };
    if (typeof token !== "string" || token.length === 0) {
      res.status(400).json({ error: "token es requerido." });
      return;
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }

    const result = await usersRepository.resetPasswordWithToken(token, newPassword);
    if (result === "invalid") {
      res.status(400).json({ error: "El enlace de recuperación no es válido." });
      return;
    }
    if (result === "expired") {
      res.status(400).json({ error: "El enlace de recuperación expiró. Solicitá uno nuevo." });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
