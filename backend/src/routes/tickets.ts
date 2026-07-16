import { Router } from "express";
import { ticketsRepository } from "../repositories/ticketsRepository";
import { TicketFilters, TicketPriority, TicketStatus } from "../types";

export const ticketsRouter = Router();

const VALID_STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const VALID_PRIORITIES: TicketPriority[] = ["low", "normal", "high", "critical"];

// IMPORTANTE: /stats debe declararse antes de cualquier ruta con parámetro
// dinámico para que Express no intente resolver "stats" como un :id.
ticketsRouter.get("/stats", (_req, res) => {
  res.json(ticketsRepository.getStats());
});

ticketsRouter.get("/", (req, res) => {
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

  res.json(ticketsRepository.findAll(filters));
});
