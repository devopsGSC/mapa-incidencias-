import { Server } from "socket.io";
import { advanceRandomTicket, createLiveTicket } from "../data/store";

const MIN_INTERVAL_MS = 8000;
const MAX_INTERVAL_MS = 15000;

function randomInterval(): number {
  return Math.floor(
    Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS + 1) + MIN_INTERVAL_MS
  );
}

/**
 * Simula actividad en vivo de la mesa de ayuda: cada 8-15s crea un ticket
 * nuevo o hace avanzar el estado de uno existente, emitiendo el evento
 * correspondiente por socket.io. Al migrar a osTicket real, esto se
 * reemplaza por listeners de cambios reales (webhooks, polling a la BD, etc).
 */
export function startLiveSimulator(io: Server): void {
  const tick = () => {
    const shouldCreateNew = Math.random() < 0.55;

    if (shouldCreateNew) {
      const ticket = createLiveTicket();
      io.emit("ticket:new", ticket);
    } else {
      const ticket = advanceRandomTicket();
      if (ticket) {
        io.emit("ticket:updated", ticket);
      }
    }

    setTimeout(tick, randomInterval());
  };

  setTimeout(tick, randomInterval());
}
