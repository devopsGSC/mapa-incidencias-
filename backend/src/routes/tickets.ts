import { Router } from "express";
import { ticketsRepository } from "../repositories/ticketsRepository";
import { TicketFilters, TicketPriority, TicketStatus } from "../types";

export const ticketsRouter = Router();

const VALID_STATUSES: TicketStatus[] = ["open", "resolved", "closed"];
const VALID_PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgente"];

// IMPORTANTE: /stats debe declararse antes de cualquier ruta con parámetro
// dinámico para que Express no intente resolver "stats" como un :id.
ticketsRouter.get("/stats", async (_req, res, next) => {
  try {
    res.json(await ticketsRepository.getStats());
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

    res.json(await ticketsRepository.findAll(filters));
  } catch (error) {
    next(error);
  }
});
