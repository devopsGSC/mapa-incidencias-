import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../api/client";
import { Ticket } from "../types";

interface HeartbeatPayload {
  at: string;
  checked: number;
}

interface UseSocketOptions {
  onTicketNew: (ticket: Ticket) => void;
  onTicketUpdated: (ticket: Ticket) => void;
  onHeartbeat: (payload: HeartbeatPayload) => void;
}

export function useSocket({ onTicketNew, onTicketUpdated, onHeartbeat }: UseSocketOptions) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef({ onTicketNew, onTicketUpdated, onHeartbeat });
  handlersRef.current = { onTicketNew, onTicketUpdated, onHeartbeat };

  useEffect(() => {
    const socket: Socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("ticket:new", (ticket: Ticket) => handlersRef.current.onTicketNew(ticket));
    socket.on("ticket:updated", (ticket: Ticket) =>
      handlersRef.current.onTicketUpdated(ticket)
    );
    socket.on("sync:heartbeat", (payload: HeartbeatPayload) =>
      handlersRef.current.onHeartbeat(payload)
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  return { connected };
}
