import { Router } from "express";
import { requireAuth } from "../auth";
import { ticketsRepository } from "../repositories/ticketsRepository";
import { usersRepository } from "../repositories/usersRepository";
import { TicketFilters, TicketPriority, TicketStatus } from "../types";

export const ticketsRouter = Router();

ticketsRouter.use(requireAuth);

const VALID_STATUSES: TicketStatus[] = ["open", "resolved", "closed"];
const VALID_PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgente"];

// IMPORTANTE: /stats debe declararse antes de cualquier ruta con parámetro
// dinámico para que Express no intente resolver "stats" como un :id.
ticketsRouter.get("/stats", async (req, res, next) => {
  try {
    // Se relee de usersRepository en cada request (nunca de un valor
    // embebido en el JWT): un cambio de allowedDepartments hecho por el
    // admin aplica en la próxima petición, sin esperar a que expire la sesión.
    const allowedDepartments = usersRepository.getAllowedDepartments(req.user!.username);
    res.json(await ticketsRepository.getStats(allowedDepartments));
  } catch (error) {
    next(error);
  }
});

ticketsRouter.get("/", async (req, res, next) => {
  try {
    const { siteId, status, priority } = req.query;

    const filters: TicketFilters = {};

    if (typeof siteId === "string" && siteId.length > 0) {
      filters.siteId = siteId;
    }

    if (typeof status === "string" && VALID_STATUSES.includes(status as TicketStatus)) {
      filters.status = status as TicketStatus;
    }

    if (
      typeof priority === "string" &&
      VALID_PRIORITIES.includes(priority as TicketPriority)
    ) {
      filters.priority = priority as TicketPriority;
    }

    const allowedDepartments = usersRepository.getAllowedDepartments(req.user!.username);
    res.json(await ticketsRepository.findAll(filters, allowedDepartments));
  } catch (error) {
    next(error);
  }
});
