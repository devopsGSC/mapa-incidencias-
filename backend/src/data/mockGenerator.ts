import { Site, Ticket, TicketPriority, TicketStatus } from "../types";
import {
  DEPARTMENTS,
  Department,
  REQUESTER_FIRST_NAMES,
  REQUESTER_LAST_NAMES,
  TOPICS_BY_DEPARTMENT,
} from "./departments";
import { SITES } from "./sites";

let idCounter = 10000;

function nextTicketId(): string {
  idCounter += 1;
  return `TCK-${idCounter}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function weightedRandom<T>(weights: [T, number][]): T {
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of weights) {
    if (roll < weight) return value;
    roll -= weight;
  }
  return weights[weights.length - 1][0];
}

function randomRequester(): string {
  return `${randomFrom(REQUESTER_FIRST_NAMES)} ${randomFrom(REQUESTER_LAST_NAMES)}`;
}

function buildSubject(department: Department, site: Site): string {
  const topic = randomFrom(TOPICS_BY_DEPARTMENT[department]);
  return `${topic} - ${site.name}`;
}

/** Prioridad: normal es la más común, critical la más rara. */
function randomPriority(): TicketPriority {
  return weightedRandom<TicketPriority>([
    ["low", 20],
    ["normal", 45],
    ["high", 25],
    ["critical", 10],
  ]);
}

/**
 * Estado en función de la antigüedad del ticket: los recientes tienden a
 * estar abiertos/en progreso, los antiguos tienden a estar resueltos/cerrados.
 */
function statusForAge(ageDays: number): TicketStatus {
  if (ageDays <= 2) {
    return weightedRandom<TicketStatus>([
      ["open", 50],
      ["in_progress", 35],
      ["resolved", 10],
      ["closed", 5],
    ]);
  }
  if (ageDays <= 7) {
    return weightedRandom<TicketStatus>([
      ["open", 20],
      ["in_progress", 30],
      ["resolved", 30],
      ["closed", 20],
    ]);
  }
  if (ageDays <= 15) {
    return weightedRandom<TicketStatus>([
      ["open", 8],
      ["in_progress", 12],
      ["resolved", 35],
      ["closed", 45],
    ]);
  }
  return weightedRandom<TicketStatus>([
    ["open", 3],
    ["in_progress", 5],
    ["resolved", 22],
    ["closed", 70],
  ]);
}

function randomDepartment(): Department {
  return randomFrom(DEPARTMENTS);
}

function buildTicketWithAge(ageDays: number, createdAt: Date): Ticket {
  const site = randomFrom(SITES);
  const department = randomDepartment();
  const status = statusForAge(ageDays);

  let updatedAt = new Date(createdAt);
  if (status === "resolved" || status === "closed") {
    // La actualización final ocurre en algún punto entre la creación y ahora
    // (o hasta el fin de vida "razonable" del ticket).
    const maxOffsetMs = Math.min(
      Date.now() - createdAt.getTime(),
      ageDays * 24 * 60 * 60 * 1000
    );
    const offsetMs = randomInt(0, Math.max(maxOffsetMs, 1));
    updatedAt = new Date(createdAt.getTime() + offsetMs);
  } else if (status === "in_progress") {
    const offsetMs = randomInt(0, 6 * 60 * 60 * 1000);
    updatedAt = new Date(
      Math.min(createdAt.getTime() + offsetMs, Date.now())
    );
  }

  return {
    id: nextTicketId(),
    subject: buildSubject(department, site),
    status,
    priority: randomPriority(),
    department,
    siteId: site.id,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    requester: randomRequester(),
  };
}

/** Genera el set inicial de tickets (80-150), distribuidos en los últimos 30 días. */
export function generateInitialTickets(): Ticket[] {
  const count = randomInt(80, 150);
  const tickets: Ticket[] = [];
  for (let i = 0; i < count; i += 1) {
    const ageDays = randomInt(0, 30);
    const createdAt = new Date(
      Date.now() - ageDays * 24 * 60 * 60 * 1000 - randomInt(0, 23) * 60 * 60 * 1000
    );
    tickets.push(buildTicketWithAge(ageDays, createdAt));
  }
  return tickets.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Genera un ticket nuevo "en vivo", creado justo ahora, casi siempre abierto. */
export function generateLiveTicket(): Ticket {
  const site = randomFrom(SITES);
  const department = randomDepartment();
  const now = new Date();
  const status = weightedRandom<TicketStatus>([
    ["open", 85],
    ["in_progress", 15],
  ]);

  return {
    id: nextTicketId(),
    subject: buildSubject(department, site),
    status,
    priority: randomPriority(),
    department,
    siteId: site.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    requester: randomRequester(),
  };
}

const STATUS_PROGRESSION: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress", "resolved"],
  in_progress: ["resolved", "closed"],
  resolved: ["closed", "in_progress"],
  closed: ["closed"],
};

/** Devuelve el próximo estado "lógico" siguiente para simular avance de un caso. */
export function nextStatus(current: TicketStatus): TicketStatus {
  return randomFrom(STATUS_PROGRESSION[current]);
}
