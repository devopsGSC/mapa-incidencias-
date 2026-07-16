import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../api/client";
import { Ticket } from "../types";

interface UseSocketOptions {
  onTicketNew: (ticket: Ticket) => void;
  onTicketUpdated: (ticket: Ticket) => void;
}

export function useSocket({ onTicketNew, onTicketUpdated }: UseSocketOptions) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef({ onTicketNew, onTicketUpdated });
  handlersRef.current = { onTicketNew, onTicketUpdated };

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

    return () => {
      socket.disconnect();
    };
  }, []);

  return { connected };
}
