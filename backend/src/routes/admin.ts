import bcrypt from "bcryptjs";
import { Router } from "express";
import { readOnlyQuery } from "../db";
import { ADMIN_COOKIE_NAME, getAdminEnvOrThrow, requireAdminAuth, signAdminToken } from "../auth";
import { normalizeName } from "../lib/normalizeName";
import { sitesRepository } from "../repositories/sitesRepository";
import { SiteType } from "../types";

export const adminRouter = Router();

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8h, igual que la expiración del JWT

adminRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = (req.body ?? {}) as { username?: unknown; password?: unknown };
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "username y password son requeridos." });
      return;
    }

    let env;
    try {
      env = getAdminEnvOrThrow();
    } catch {
      res.status(500).json({ error: "Admin no configurado en este servidor." });
      return;
    }

    const passwordMatches =
      username === env.username && (await bcrypt.compare(password, env.passwordHash));
    if (!passwordMatches) {
      res.status(401).json({ error: "Usuario o contraseña incorrectos." });
      return;
    }

    const token = signAdminToken(username, env.jwtSecret);
    res.cookie(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE_MS,
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/logout", (_req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME);
  res.json({ ok: true });
});

// Todo lo registrado DESPUÉS de este .use() exige sesión admin válida.
adminRouter.use(requireAdminAuth);

// "Sitio de Aduana" (list_id=2) + "CCTV Sitios" (list_id=7): las mismas dos
// listas que usa ticketsRepository para resolver el sitio de cada ticket
// (ver comentario en SITE_LIST_IDS ahí). Un sitio "real" es cualquier valor
// vigente en cualquiera de las dos.
const SITE_LIST_IDS = [2, 7];
const VALID_SITE_TYPES: SiteType[] = ["aduana_terrestre", "aduana_maritima", "aduana_aerea", "sede"];

async function loadRealSiteNames(): Promise<string[]> {
  const rows = await readOnlyQuery<{ value: string }>(
    `SELECT DISTINCT value FROM ost_list_items WHERE list_id IN (${SITE_LIST_IDS.join(",")}) ORDER BY id`
  );
  return rows.map((row) => row.value);
}

/** Sitios reales de osTicket que todavía no tienen una entrada en site-metadata.json. */
adminRouter.get("/sites/unmapped", async (_req, res, next) => {
  try {
    const realNames = await loadRealSiteNames();
    const configuredNormalized = new Set(
      sitesRepository.findAll().map((site) => normalizeName(site.name))
    );

    const seen = new Set<string>();
    const unmapped: string[] = [];
    for (const name of realNames) {
      const key = normalizeName(name);
      if (configuredNormalized.has(key) || seen.has(key)) continue;
      seen.add(key);
      unmapped.push(name);
    }

    res.json(unmapped);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/sites", (_req, res) => {
  res.json(sitesRepository.findAll());
});

/**
 * Asigna coordenadas (lat/lng) y tipo a un sitio que YA existe en osTicket —
 * este endpoint nunca "crea" un sitio en el sentido de inventarlo. El name
 * recibido se valida en vivo contra ost_list_items antes de guardar nada:
 * si no coincide (comparación normalizada) con ningún valor real, se
 * rechaza con 400. Esto vale tanto si la petición viene del panel como si
 * viene de Postman/curl directo — la validación es del backend, nunca se
 * confía en que el frontend ya filtró los nombres válidos.
 */
adminRouter.post("/sites", async (req, res, next) => {
  try {
    const { name, type, lat, lng } = (req.body ?? {}) as {
      name?: unknown;
      type?: unknown;
      lat?: unknown;
      lng?: unknown;
    };

    if (typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "name es requerido." });
      return;
    }
    if (typeof type !== "string" || !VALID_SITE_TYPES.includes(type as SiteType)) {
      res.status(400).json({ error: `type debe ser uno de: ${VALID_SITE_TYPES.join(", ")}` });
      return;
    }
    if (
      typeof lat !== "number" ||
      !Number.isFinite(lat) ||
      typeof lng !== "number" ||
      !Number.isFinite(lng)
    ) {
      res.status(400).json({ error: "lat y lng deben ser números." });
      return;
    }

    const realNames = await loadRealSiteNames();
    const target = normalizeName(name);
    const isRealSite = realNames.some((real) => normalizeName(real) === target);
    if (!isRealSite) {
      res.status(400).json({
        error: `"${name}" no existe como sitio real en osTicket (ost_list_items, list_id IN (${SITE_LIST_IDS.join(
          ","
        )})). No se puede asignar coordenadas a un sitio inventado.`,
      });
      return;
    }

    const saved = sitesRepository.upsert({ name: name.trim(), type: type as SiteType, lat, lng });
    res.status(200).json(saved);
  } catch (error) {
    next(error);
  }
});

adminRouter.delete("/sites/:name", (req, res) => {
  const removed = sitesRepository.remove(decodeURIComponent(req.params.name));
  if (!removed) {
    res.status(404).json({ error: "Sitio no encontrado en site-metadata.json." });
    return;
  }
  res.json({ ok: true });
});
