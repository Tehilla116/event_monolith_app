import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./routes/auth.routes";
import { eventRoutes } from "./routes/event.routes";
import { setServerInstance } from "./services/websocket.service";

const app = new Elysia()
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
  // WebSocket handler
  .ws("/ws", {
    open(ws) {
      console.log("🔌 WebSocket client connected");
      
      // Subscribe to topics
      ws.subscribe("events");
      ws.subscribe("rsvps");
      
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
    },
    message(ws, message: any) {
      console.log("📨 WebSocket message received:", message);
      
      // Handle client messages (optional)
      try {
        const data = typeof message === "string" ? JSON.parse(message) : JSON.parse(message.toString());
        
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
      ws.unsubscribe("events");
      ws.unsubscribe("rsvps");
    },
  })
  .listen(8080);

// Pass the app server instance to websocket service for publishing
setServerInstance(app.server);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(`🔌 WebSocket available at ws://${app.server?.hostname}:${app.server?.port}/ws`);

export default app;
