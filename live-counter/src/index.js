import { DurableObject } from "cloudflare:workers";

/**
 * LiveCounter Durable Object
 * 
 * Manages active WebSocket connections in memory, tracks heartbeats,
 * applies per-IP concurrent connection limits, and broadcasts the real-time
 * active user count to all connected clients.
 */
export class LiveCounter extends DurableObject {
  /**
   * @param {DurableObjectState} ctx - Durable Object execution context and storage
   * @param {Record<string, any>} env - Environment bindings
   */
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;

    /** @type {Map<WebSocket, { ip: string, lastSeen: number }>} */
    this.sessions = new Map();

    /** @type {Map<string, number>} Track concurrent connections per IP */
    this.ipCounts = new Map();

    // Configuration constants
    this.MAX_CONCURRENT_PER_IP = 5;
    this.HEARTBEAT_TIMEOUT_MS = 60 * 1000; // 60 seconds without ping = disconnected
    this.ALARM_INTERVAL_MS = 25 * 1000;    // Run cleanup sweep alarm every 25 seconds
  }

  /**
   * Handles incoming HTTP / WebSocket upgrade requests
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  async fetch(request) {
    // Provide a simple HTTP status/health response if not a WebSocket upgrade request
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      return new Response(
        JSON.stringify({
          status: "online",
          activeUsers: this.sessions.size,
          message: "LiveCounter WebSocket endpoint. Connect with WebSocket client."
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Extract client IP address for rate-limiting & abuse prevention
    const clientIp = request.headers.get("cf-connecting-ip") || "unknown";

    // 5. Rate limiting: reject if single IP opens more than 5 concurrent connections
    const currentIpCount = this.ipCounts.get(clientIp) || 0;
    if (clientIp !== "unknown" && currentIpCount >= this.MAX_CONCURRENT_PER_IP) {
      return new Response("Too many concurrent WebSocket connections from this IP", {
        status: 429,
        statusText: "Too Many Requests",
        headers: {
          "Retry-After": "30",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 1. Establish WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept and register server-side WebSocket session
    this.handleSession(server, clientIp);

    // Return status 101 Switching Protocols with client WebSocket
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Registers and attaches event handlers for a new WebSocket session
   * @param {WebSocket} ws
   * @param {string} ip
   */
  handleSession(ws, ip) {
    ws.accept();

    const now = Date.now();
    this.sessions.set(ws, { ip, lastSeen: now });

    // Update IP count
    const count = this.ipCounts.get(ip) || 0;
    this.ipCounts.set(ip, count + 1);

    // Ensure periodic cleanup alarm is scheduled
    this.ensureAlarmScheduled();

    // Broadcast updated active user count to all sessions (including new joiner)
    this.broadcastCount();

    // Listen for client heartbeat ping messages
    ws.addEventListener("message", (event) => {
      const msg = typeof event.data === "string" ? event.data.trim() : "";
      if (msg === "ping" || msg === '{"type":"ping"}') {
        const session = this.sessions.get(ws);
        if (session) {
          session.lastSeen = Date.now();
        }
        try {
          ws.send(JSON.stringify({ type: "pong", activeUsers: this.sessions.size }));
        } catch (e) {
          // Socket closing
        }
      }
    });

    // Handle session disconnect and error events
    ws.addEventListener("close", () => {
      this.removeSession(ws);
    });

    ws.addEventListener("error", () => {
      this.removeSession(ws);
    });
  }

  /**
   * Safely removes a session, decrements IP counter, and broadcasts updated count
   * @param {WebSocket} ws
   */
  removeSession(ws) {
    const session = this.sessions.get(ws);
    if (!session) return;

    const { ip } = session;
    this.sessions.delete(ws);

    // Decrement IP count
    const count = this.ipCounts.get(ip);
    if (count !== undefined) {
      if (count <= 1) {
        this.ipCounts.delete(ip);
      } else {
        this.ipCounts.set(ip, count - 1);
      }
    }

    try {
      ws.close(1000, "Closed");
    } catch (e) {
      // Sockets may already be closed
    }

    // Broadcast new count to remaining clients
    this.broadcastCount();
  }

  /**
   * Broadcasts the current active user count as JSON: { activeUsers: number }
   */
  broadcastCount() {
    const payload = JSON.stringify({ activeUsers: this.sessions.size });
    const deadSockets = [];

    for (const [ws] of this.sessions.entries()) {
      try {
        ws.send(payload);
      } catch (err) {
        // Socket is no longer writable
        deadSockets.push(ws);
      }
    }

    // Clean up any sockets that failed during broadcast
    for (const ws of deadSockets) {
      this.removeSession(ws);
    }
  }

  /**
   * Ensures an alarm is scheduled for periodic heartbeat sweep
   */
  async ensureAlarmScheduled() {
    try {
      const currentAlarm = await this.ctx.storage.getAlarm();
      if (currentAlarm === null) {
        await this.ctx.storage.setAlarm(Date.now() + this.ALARM_INTERVAL_MS);
      }
    } catch (err) {
      console.error("Failed to schedule alarm:", err);
    }
  }

  /**
   * Periodic alarm triggered by Cloudflare runtime:
   * Scans sessions for stale heartbeats (> 60s without ping) and purges them.
   */
  async alarm() {
    const now = Date.now();
    const deadSockets = [];

    for (const [ws, session] of this.sessions.entries()) {
      if (now - session.lastSeen > this.HEARTBEAT_TIMEOUT_MS) {
        deadSockets.push(ws);
      }
    }

    for (const ws of deadSockets) {
      try {
        ws.close(1000, "Heartbeat timeout");
      } catch (e) {
        // Ignore
      }
      this.removeSession(ws);
    }

    // Reschedule next alarm if sessions are still active
    if (this.sessions.size > 0) {
      await this.ctx.storage.setAlarm(Date.now() + this.ALARM_INTERVAL_MS);
    }
  }
}

/** Export alias for backwards compatibility with any existing DO instances */
export class MyDurableObject extends LiveCounter {}

/**
 * Worker Entry Point (index.js)
 * Routes all incoming requests to a single named Durable Object instance (singleton pattern)
 */
export default {
  /**
   * @param {Request} request
   * @param {{ LIVE_COUNTER: DurableObjectNamespace }} env
   * @param {ExecutionContext} ctx
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    // Singleton pattern: all requests route to the "global" named Durable Object instance
    const id = env.LIVE_COUNTER.idFromName("global");
    const liveCounterStub = env.LIVE_COUNTER.get(id);

    // Forward the request (including WebSocket upgrade handshake) to the Durable Object
    return liveCounterStub.fetch(request);
  },
};
