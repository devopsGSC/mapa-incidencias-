import { Ticket, TicketStatus } from "../types";
import { generateInitialTickets, generateLiveTicket, nextStatus } from "./mockGenerator";

/**
 * Store en memoria: única fuente mutable de tickets del mock.
 * Al migrar a osTicket real, esta pieza desaparece y ticketsRepository
 * consulta MySQL directamente; nada fuera de este archivo depende de
 * que los datos vivan en un arreglo en memoria.
 */
let tickets: Ticket[] = generateInitialTickets();

export function getAllTickets(): Ticket[] {
  return tickets;
}

export function addTicket(ticket: Ticket): void {
  tickets = [ticket, ...tickets];
}

function pickRandomIndex(): number | undefined {
  if (tickets.length === 0) return undefined;
  return Math.floor(Math.random() * tickets.length);
}

/** Crea un ticket nuevo "en vivo" y lo agrega al store. */
export function createLiveTicket(): Ticket {
  const ticket = generateLiveTicket();
  addTicket(ticket);
  return ticket;
}

/**
 * Avanza el estado de un ticket existente elegido al azar, simulando
 * actividad de un agente trabajando el caso. Devuelve undefined si no
 * hay tickets en el store.
 */
export function advanceRandomTicket(): Ticket | undefined {
  const index = pickRandomIndex();
  if (index === undefined) return undefined;

  const current = tickets[index];
  const updated: Ticket = {
    ...current,
    status: nextStatus(current.status),
    updatedAt: new Date().toISOString(),
  };
  tickets = [...tickets.slice(0, index), updated, ...tickets.slice(index + 1)];
  return updated;
}

export function isOpenStatus(status: TicketStatus): boolean {
  return status === "open" || status === "in_progress";
}
