import { WebSocket, WebSocketServer } from "ws";
import { type Server } from "http";
import { db } from "@db";
import { collaborationMessages, type CollaborationMessage } from "@db/schema";
import { eq } from "drizzle-orm";

interface WSMessage {
  type: "chat" | "diagnostic" | "note" | "session";
  sessionId?: number;
  content?: string;
  userId?: number;
}

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  sessionId?: number;
  isAlive?: boolean;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: "/ws",
    verifyClient: (info, cb) => {
      // Skip vite HMR protocol
      if (info.req.headers['sec-websocket-protocol']?.includes('vite-hmr')) {
        cb(false);
        return;
      }
      cb(true);
    }
  });

  // Store active connections by session
  const sessions = new Map<number, Set<ExtendedWebSocket>>();

  function heartbeat(this: ExtendedWebSocket) {
    this.isAlive = true;
  }

  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  wss.on("connection", (ws: ExtendedWebSocket) => {
    ws.isAlive = true;
    ws.on("pong", heartbeat);

    ws.on("message", async (data: string) => {
      try {
        const message: WSMessage = JSON.parse(data);

        if (message.type === "session" && message.sessionId && message.userId) {
          ws.sessionId = message.sessionId;
          ws.userId = message.userId;

          if (!sessions.has(message.sessionId)) {
            sessions.set(message.sessionId, new Set());
          }
          sessions.get(message.sessionId)!.add(ws);
          return;
        }

        // Validate the message structure for chat messages
        if (!ws.sessionId || !ws.userId || !message.type || !message.content) {
          ws.send(JSON.stringify({ error: "Invalid message format" }));
          return;
        }

        // Store the message in the database
        const [savedMessage] = await db
          .insert(collaborationMessages)
          .values({
            session_id: ws.sessionId,
            sender_id: ws.userId,
            content: message.content,
            type: message.type,
          })
          .returning();

        // Broadcast to all clients in the same session
        const sessionClients = sessions.get(ws.sessionId);
        if (sessionClients) {
          const broadcastData = JSON.stringify({
            type: message.type,
            message: savedMessage,
          });

          sessionClients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ error: "Failed to process message" }));
      }
    });

    // Cleanup on connection close
    ws.on("close", () => {
      if (ws.sessionId && sessions.has(ws.sessionId)) {
        sessions.get(ws.sessionId)!.delete(ws);
        if (sessions.get(ws.sessionId)!.size === 0) {
          sessions.delete(ws.sessionId);
        }
      }
    });
  });

  return wss;
}