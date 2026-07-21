import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import { whatsappDailySummaryHandler, whatsappMeetingReminderHandler } from "../whatsappScheduled";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Global WebSocket clients set
const wsClients = new Set<WebSocket>();

async function startServer() {
  const app = express();
  const server = createServer(app);

  // WebSocket server for realtime
  const wss = new WebSocketServer({ server, path: "/api/ws" });
  wss.on("connection", (ws) => {
    wsClients.add(ws);
    ws.on("close", () => wsClients.delete(ws));
    ws.on("message", (data) => {
      // Broadcast to all other clients
      const msg = data.toString();
      wsClients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // File upload endpoint (supports images and videos up to 50 MB)
  app.post("/api/upload", express.raw({ type: "*/*", limit: "50mb" }), async (req, res) => {
    try {
      const contentType = (req.headers["x-content-type"] as string) || "image/jpeg";
      const filename = (req.headers["x-filename"] as string) || `upload.${contentType.split("/")[1] || "bin"}`;
      const data = req.body as Buffer;
      if (!data || !data.length) {
        res.status(400).json({ error: "No file data" });
        return;
      }
      const { url } = await storagePut(`uploads/${filename}`, data, contentType);
      res.json({ url });
    } catch (err: any) {
      console.error("[Upload] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Heartbeat: WhatsApp scheduled jobs ───────────────────────────────────────────────────────────────────
  app.post("/api/scheduled/whatsapp-daily-summary", whatsappDailySummaryHandler);
  app.post("/api/scheduled/whatsapp-meeting-reminder", whatsappMeetingReminderHandler);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
