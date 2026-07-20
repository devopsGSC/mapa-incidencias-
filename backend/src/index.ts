import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { adminRouter } from "./routes/admin";
import { sitesRouter } from "./routes/sites";
import { ticketsRouter } from "./routes/tickets";
import { startLiveSimulator } from "./sockets/liveSimulator";

const PORT = Number(process.env.PORT ?? 4000);
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",");

const app = express();
// credentials:true + origin explícito (nunca "*") porque el login de
// /api/admin depende de una cookie httpOnly cross-origin (frontend en :5173,
// backend en :4000 en dev).
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/sites", sitesRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/admin", adminRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS },
});

io.on("connection", (socket) => {
  console.log(`[socket] cliente conectado: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[socket] cliente desconectado: ${socket.id}`);
  });
});

startLiveSimulator(io);

httpServer.listen(PORT, () => {
  console.log(`API + socket.io escuchando en http://localhost:${PORT}`);
});
