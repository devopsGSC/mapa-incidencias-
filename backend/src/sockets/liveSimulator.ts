import { Server } from "socket.io";
import { readOnlyQuery } from "../db";
import {
  loadMapRowContext,
  mapTicketRow,
  TICKETS_SELECT,
  TicketRow,
} from "../repositories/ticketsRepository";

const POLL_INTERVAL_MS = 20000; // 20s (rango pedido: 15-30s)

/**
 * El "watermark" (marca de hasta dónde ya revisamos) se guarda SIEMPRE como
 * el string crudo que devuelve MySQL ("YYYY-MM-DD HH:MM:SS"), nunca como un
 * objeto Date de JS. Si se pasara un Date como parámetro de consulta,
 * mysql2 lo reconvierte usando la timezone LOCAL del proceso de Node al
 * serializarlo — y el servidor de la base tiene varias horas de desfase de
 * reloj respecto a este proceso, lo que hacía que el watermark nunca
 * "alcanzara" el reloj real de la base y el poller reemitiera los mismos
 * tickets en cada ciclo. Comparando string-contra-string (formato de ancho
 * fijo, así que el orden lexicográfico == orden cronológico) todo queda
 * autoconsistente con el propio reloj de la base, sin importar el desfase.
 */
async function fetchWatermark(): Promise<string> {
  const [row] = await readOnlyQuery<{ watermark: string }>("SELECT NOW() AS watermark");
  return row.watermark;
}

function maxRawDatetime(a: string, b: string | null): string {
  if (!b) return a;
  return b > a ? b : a;
}

/**
 * Polling real contra ost_ticket: cada POLL_INTERVAL_MS busca tickets
 * creados o actualizados (lastupdate) desde el último watermark y emite
 * ticket:new / ticket:updated por socket.io con la misma forma de Ticket
 * que ya consume el frontend. Reemplaza al generador mock — el nombre de
 * la función se mantiene para no tocar el import en index.ts.
 */
export function startLiveSimulator(io: Server): void {
  let watermark: string;

  const tick = async () => {
    try {
      const currentWatermark = watermark;
      const [rows, ctx] = await Promise.all([
        readOnlyQuery<TicketRow>(
          `${TICKETS_SELECT} AND (t.created > ? OR t.lastupdate > ?) ORDER BY t.lastupdate ASC`,
          [currentWatermark, currentWatermark]
        ),
        loadMapRowContext(),
      ]);

      let nextWatermark = currentWatermark;
      for (const row of rows) {
        const ticket = mapTicketRow(row, ctx);
        nextWatermark = maxRawDatetime(nextWatermark, row.created);
        nextWatermark = maxRawDatetime(nextWatermark, row.lastupdate);
        if (!ticket) continue; // Archivado/Borrado u otro estado excluido: no se emite

        const isNewTicket = row.created > currentWatermark;
        io.emit(isNewTicket ? "ticket:new" : "ticket:updated", ticket);
      }

      watermark = nextWatermark;

      // Señal liviana en CADA ciclo (haya o no cambios), para que el
      // frontend pueda mostrar "sigue sincronizando" incluso cuando no
      // llega ningún ticket:new/ticket:updated por un rato.
      io.emit("sync:heartbeat", { at: new Date().toISOString(), checked: rows.length });
    } catch (error) {
      console.error("[poller] error consultando tickets:", (error as Error).message);
      // No avanzamos el watermark si falló: el próximo poll reintenta la misma ventana.
    } finally {
      setTimeout(tick, POLL_INTERVAL_MS);
    }
  };

  fetchWatermark()
    .then((initial) => {
      watermark = initial;
      setTimeout(tick, POLL_INTERVAL_MS);
    })
    .catch((error) => {
      console.error("[poller] no se pudo obtener el watermark inicial:", error.message);
    });
}
