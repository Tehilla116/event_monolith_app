import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./routes/auth.routes";
import { eventRoutes } from "./routes/event.routes";
import { setServerInstance, startHeartbeat, addConnection, removeConnection } from "./services/websocket.service";

const app: any = new Elysia()
  .onError(({ code, error, set }) => {
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? (error as Error).message 
      : 'An error occurred';
    
    console.error("🚨 Server error:", code, errorMessage);
    
    if (code === 'VALIDATION') {
      set.status = 422;
      return {
        error: 'Validation failed',
        message: errorMessage,
        details: error
      };
    }
    
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'Route not found' };
    }
    
    set.status = 500;
    return {
      error: 'Internal server error',
      message: errorMessage
    };
  })
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Event Management API",
          version: "1.0.0",
          description: "Full-stack monolith event management application",
        },
      },
    })
  )
  .get("/", () => "Hello Elysia")
  .use(authRoutes)
  .use(eventRoutes)
  // Health check endpoint for diagnostics
  .get('/health', ({ set }): { pid: number; portEnv: string | null; hostEnv: string | null; nodeEnv: string | null; uptimeSeconds: number; serverHostname: string | null; serverPort: number | null } => {
    const info = {
      pid: process.pid,
      portEnv: process.env.PORT || null,
      hostEnv: process.env.HOST || null,
      nodeEnv: process.env.NODE_ENV || null,
      uptimeSeconds: process.uptime(),
      serverHostname: app.server?.hostname || null,
      serverPort: app.server?.port || null,
    }
    set.status = 200
    return info
  })
  // WebSocket handler
  .ws("/ws", {
    open(ws) {
      console.log("🔌 WebSocket client connected");

      // Register connection with the websocket service (for heartbeat & fallback broadcasting)
      try { addConnection(ws); } catch (e) { /* ignore */ }

      // Subscribe to topics
      ws.subscribe("events");
      ws.subscribe("rsvps");

      // Mark alive (in case the implementation exposes it)
      try { (ws as any)._isAlive = true; } catch (e) {}

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: "CONNECTED",
          data: {
            message: "Connected to Event Management WebSocket",
            topics: ["events", "rsvps"],
            timestamp: new Date().toISOString(),
          },
        })
      );

      // Start per-connection heartbeat ping (store interval on ws.data to clear later)
      try {
        const interval = setInterval(() => {
          try {
            if (typeof ws.ping === 'function') {
              ws.ping();
            } else {
              // fallback to message-level ping
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          } catch (e) {
            // ignore send/ping errors
          }
        }, 30000);

        if (!(ws as any).data) (ws as any).data = {};
        (ws as any).data.heartbeatInterval = interval;
      } catch (e) {
        // ignore heartbeat setup errors
      }
    },
    message(ws, message: any) {
      // lightweight parse and respond to ping/pong to keep connection alive
      let parsed: any = null;
      try {
        parsed = typeof message === "string" ? JSON.parse(message) : JSON.parse(message.toString());
      } catch (err) {
        // not a JSON message - ignore for heartbeat handling
      }

      // If client responded to our ping
      if (parsed && parsed.type === 'PONG') {
        try { (ws as any)._isAlive = true; } catch (e) {}
        return;
      }

      // If client sent a ping, reply with PONG
      if (parsed && parsed.type === 'PING') {
        try { ws.send(JSON.stringify({ type: 'PONG' })); } catch (e) {}
        try { (ws as any)._isAlive = true; } catch (e) {}
        return;
      }

      console.log("📨 WebSocket message received:", message);

      // Handle client messages (optional)
      try {
        const data = parsed || (typeof message === "string" ? JSON.parse(message) : message);

        // Echo back for testing
        ws.send(
          JSON.stringify({
            type: "MESSAGE_RECEIVED",
            data: {
              received: data,
              timestamp: new Date().toISOString(),
            },
          })
        );
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    },
    close(ws) {
      console.log("🔌 WebSocket client disconnected");

      // Unsubscribe from topics
      try { ws.unsubscribe("events"); } catch (e) {}
      try { ws.unsubscribe("rsvps"); } catch (e) {}

      try { removeConnection(ws); } catch (e) {}

      // Clear per-connection heartbeat interval to avoid leaks
      try {
        const interval = (ws as any).data?.heartbeatInterval;
        if (interval) clearInterval(interval);
      } catch (e) {
        // ignore
      }
    },
  })
 
// Start server in a safe start function so we can handle EADDRINUSE and other errors
async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

  // Helper sleep
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await app.listen({ hostname, port });

      // Pass the app server instance to websocket service for publishing
      setServerInstance(app.server);

      // Start heartbeat to keep connections alive and cleanup dead sockets
      try {
        startHeartbeat(30000); // 30s interval
      } catch (e) {
        console.warn('Could not start websocket heartbeat:', e);
      }

      const proto = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';
      console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
      console.log(`🔌 WebSocket available at ${proto}://${app.server?.hostname}:${app.server?.port}/ws`);

      // Debug: log HTTP upgrade requests (helps diagnose WebSocket handshake failures in production)
      const server = app.server as any
      if (server && typeof server.on === 'function') {
        server.on('upgrade', (req: any, _socket: any, _head: any) => {
          console.log('🔄 HTTP Upgrade request:', req.url, { headers: req.headers, method: req.method, remoteAddress: req.socket?.remoteAddress })
        })
      }

      // Log process and environment info for diagnostics
      console.log(`PID: ${process.pid} | PORT env: ${process.env.PORT || 'unset'} | HOST env: ${process.env.HOST || 'unset'} | NODE_ENV: ${process.env.NODE_ENV || 'unset'}`);

      // Success - break out of retry loop
      return;
    } catch (err: any) {
      if (err && err.code === 'EADDRINUSE') {
        const delay = 200 * Math.pow(2, attempt - 1); // exponential backoff starting at 200ms
        console.warn(`Attempt ${attempt}/${maxAttempts}: Port ${port} in use; retrying in ${delay}ms...`);
        if (attempt === maxAttempts) {
          console.error(`Port ${port} is still in use after ${maxAttempts} attempts. Exiting.`);
          process.exit(1);
        }
        await sleep(delay);
        continue;
      }

      console.error('Failed to start server:', err);
      process.exit(1);
    }
  }
}

// Only start server when this file is executed directly (not when imported)
if (import.meta.main) {
  startServer();
}
