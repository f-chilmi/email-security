import WebSocket from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { JWTPayload, TestProgress } from "../types";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  sessionIds?: Set<string>;
}

class WebSocketManager {
  private wss: WebSocket.Server;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocket.Server({
      server,
      path: "/ws",
      verifyClient: (info: any) => {
        console.log(info);
        // Basic validation - detailed auth happens in connection handler
        return true;
      },
    });

    this.wss.on("connection", this.handleConnection.bind(this));
    console.log("WebSocket server initialized");
  }

  private async handleConnection(
    ws: AuthenticatedWebSocket,
    req: any
  ): Promise<void> {
    console.log("New WebSocket connection attempt");

    try {
      // Extract token from query params or headers
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token =
        url.searchParams.get("token") ||
        req.headers.authorization?.split(" ")[1];

      if (!token) {
        ws.close(1008, "Authentication required");
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        ws.close(1011, "Server configuration error");
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      ws.userId = decoded.userId;
      ws.sessionIds = new Set();

      // Add client to user's connection set
      if (!this.clients.has(decoded.userId)) {
        this.clients.set(decoded.userId, new Set());
      }
      this.clients.get(decoded.userId)!.add(ws);

      console.log(`WebSocket authenticated for user: ${decoded.userId}`);

      // Send initial connection success message
      this.sendToClient(ws, {
        type: "connection_established",
        data: { userId: decoded.userId },
      });

      // Handle incoming messages
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          this.sendToClient(ws, {
            type: "error",
            data: { message: "Invalid message format" },
          });
        }
      });

      // Handle disconnection
      ws.on("close", () => {
        this.removeClient(ws);
        console.log(`WebSocket disconnected for user: ${decoded.userId}`);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.removeClient(ws);
      });
    } catch (error) {
      console.error("WebSocket authentication failed:", error);
      ws.close(1008, "Authentication failed");
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: any): void {
    switch (message.type) {
      case "subscribe_session":
        if (message.sessionId && ws.userId) {
          ws.sessionIds?.add(message.sessionId);
          this.sendToClient(ws, {
            type: "subscribed",
            data: { sessionId: message.sessionId },
          });
        }
        break;

      case "unsubscribe_session":
        if (message.sessionId && ws.sessionIds) {
          ws.sessionIds.delete(message.sessionId);
          this.sendToClient(ws, {
            type: "unsubscribed",
            data: { sessionId: message.sessionId },
          });
        }
        break;

      case "ping":
        this.sendToClient(ws, { type: "pong" });
        break;

      default:
        this.sendToClient(ws, {
          type: "error",
          data: { message: "Unknown message type" },
        });
    }
  }

  private removeClient(ws: AuthenticatedWebSocket): void {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
    }
  }

  private sendToClient(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error("Error sending WebSocket message:", error);
      }
    }
  }

  public broadcastTestProgress(userId: string, progress: TestProgress): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = {
        type: "test_progress",
        data: progress,
      };

      userClients.forEach((ws) => {
        if (
          ws.sessionIds?.has(progress.sessionId) ||
          ws.sessionIds?.size === 0
        ) {
          this.sendToClient(ws, message);
        }
      });
    }
  }

  public broadcastTestComplete(
    userId: string,
    sessionId: string,
    results: any
  ): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = {
        type: "test_complete",
        data: { sessionId, results },
      };

      userClients.forEach((ws) => {
        if (ws.sessionIds?.has(sessionId) || ws.sessionIds?.size === 0) {
          this.sendToClient(ws, message);
        }
      });
    }
  }

  public broadcastTestError(
    userId: string,
    sessionId: string,
    error: string
  ): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = {
        type: "test_error",
        data: { sessionId, error },
      };

      userClients.forEach((ws) => {
        if (ws.sessionIds?.has(sessionId) || ws.sessionIds?.size === 0) {
          this.sendToClient(ws, message);
        }
      });
    }
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  public getUserConnectionCount(userId: string): number {
    return this.clients.get(userId)?.size || 0;
  }

  public close(): void {
    this.wss.close();
    this.clients.clear();
    console.log("WebSocket server closed");
  }
}

export default WebSocketManager;
