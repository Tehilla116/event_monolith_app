/**
 * WebSocket Service for Real-time Event Updates
 * Provides broadcasting functionality for event and RSVP updates
 */

// Store the Elysia server instance for publishing
let serverInstance: any = null;

/**
 * Set the server instance for publishing messages
 * @param server - Elysia server instance
 */
export function setServerInstance(server: any) {
  serverInstance = server;
  console.log("✅ WebSocket service initialized with server instance");
}

// Store active WebSocket connections (fallback)
const connections = new Set<any>();

/**
 * Interface for WebSocket message types
 */
export interface EventUpdateMessage {
  type: "EVENT_CREATED" | "EVENT_UPDATED" | "EVENT_DELETED" | "EVENT_APPROVED";
  data: {
    eventId: string;
    event?: any;
    timestamp: string;
  };
}

export interface RsvpUpdateMessage {
  type: "RSVP_CREATED" | "RSVP_UPDATED" | "RSVP_DELETED";
  data: {
    eventId: string;
    userId: string;
    status?: string;
    rsvp?: any;
    timestamp: string;
  };
}

/**
 * Add a new WebSocket connection
 * @param ws - WebSocket connection to add
 */
export function addConnection(ws: any) {
  connections.add(ws);
  console.log(`✅ WebSocket connected. Total connections: ${connections.size}`);
}

/**
 * Remove a WebSocket connection
 * @param ws - WebSocket connection to remove
 */
export function removeConnection(ws: any) {
  connections.delete(ws);
  console.log(`❌ WebSocket disconnected. Total connections: ${connections.size}`);
}

/**
 * Broadcast event update to all connected clients
 * @param data - Event update data
 */
export function broadcastEventUpdate(data: EventUpdateMessage) {
  const message = JSON.stringify({
    ...data,
    data: {
      ...data.data,
      timestamp: new Date().toISOString(),
    },
  });

  // Use Elysia's server.publish if available
  if (serverInstance && serverInstance.publish) {
    serverInstance.publish("events", message);
    console.log(`📡 Event update published to 'events' topic`);
  } else {
    // Fallback to direct connection broadcasting
    let sentCount = 0;
    let failedCount = 0;

    connections.forEach((ws) => {
      try {
        if (ws.readyState === 1) {
          // 1 = OPEN
          ws.send(message);
          sentCount++;
        } else {
          // Remove closed connections
          connections.delete(ws);
          failedCount++;
        }
      } catch (error) {
        console.error("Error sending message to client:", error);
        connections.delete(ws);
        failedCount++;
      }
    });

    console.log(
      `📡 Event update broadcast: ${sentCount} sent, ${failedCount} failed`
    );
  }
}

/**
 * Broadcast RSVP update to all connected clients
 * @param data - RSVP update data
 */
export function broadcastRsvpUpdate(data: RsvpUpdateMessage) {
  const message = JSON.stringify({
    ...data,
    data: {
      ...data.data,
      timestamp: new Date().toISOString(),
    },
  });

  // Use Elysia's server.publish if available
  if (serverInstance && serverInstance.publish) {
    serverInstance.publish("rsvps", message);
    console.log(`📡 RSVP update published to 'rsvps' topic`);
  } else {
    // Fallback to direct connection broadcasting
    let sentCount = 0;
    let failedCount = 0;

    connections.forEach((ws) => {
      try {
        if (ws.readyState === 1) {
          // 1 = OPEN
          ws.send(message);
          sentCount++;
        } else {
          // Remove closed connections
          connections.delete(ws);
          failedCount++;
        }
      } catch (error) {
        console.error("Error sending message to client:", error);
        connections.delete(ws);
        failedCount++;
      }
    });

    console.log(
      `📡 RSVP update broadcast: ${sentCount} sent, ${failedCount} failed`
    );
  }
}

/**
 * Broadcast a custom message to all connected clients
 * @param topic - Topic to publish to (e.g., 'events', 'rsvps')
 * @param type - Message type
 * @param data - Message data
 */
export function broadcastMessage(topic: string, type: string, data: any) {
  const message = JSON.stringify({
    type,
    data: {
      ...data,
      timestamp: new Date().toISOString(),
    },
  });

  // Use Elysia's server.publish if available
  if (serverInstance && serverInstance.publish) {
    serverInstance.publish(topic, message);
    console.log(`📡 Message published to '${topic}' topic`);
  } else {
    // Fallback to direct connection broadcasting
    let sentCount = 0;
    let failedCount = 0;

    connections.forEach((ws) => {
      try {
        if (ws.readyState === 1) {
          // 1 = OPEN
          ws.send(message);
          sentCount++;
        } else {
          connections.delete(ws);
          failedCount++;
        }
      } catch (error) {
        console.error("Error sending message to client:", error);
        connections.delete(ws);
        failedCount++;
      }
    });

    console.log(`📡 Message broadcast: ${sentCount} sent, ${failedCount} failed`);
  }
}

/**
 * Get the number of active connections
 * @returns Number of active WebSocket connections
 */
export function getConnectionCount(): number {
  return connections.size;
}

/**
 * Send a message to a specific client
 * @param ws - WebSocket connection
 * @param type - Message type
 * @param data - Message data
 */
export function sendToClient(ws: any, type: string, data: any) {
  try {
    if (ws.readyState === 1) {
      const message = JSON.stringify({
        type,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      });
      ws.send(message);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error sending message to client:", error);
    return false;
  }
}
