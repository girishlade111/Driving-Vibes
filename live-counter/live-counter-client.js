/**
 * Live Counter Client-Side Integration Script (Vanilla JavaScript)
 * 
 * - Connects to Cloudflare Worker WebSocket endpoint
 * - Dynamically updates DOM element with id="live-count"
 * - Maintains connection with 25-second heartbeat ping
 * - Implements exponential backoff reconnects (3s -> 4.5s -> ... -> 30s max)
 * - Safe fallback to "—" when disconnected or error occurs
 */

(function initLiveCounter() {
  // Replace with your deployed Cloudflare Worker URL or set window.LIVE_COUNTER_URL before loading
  const DEFAULT_WS_URL = "wss://live-counter.<your-subdomain>.workers.dev";
  const WS_URL = window.LIVE_COUNTER_WS_URL || DEFAULT_WS_URL;
  const ELEMENT_ID = "live-count";

  const PING_INTERVAL_MS = 25000;       // 25s ping interval
  const INITIAL_RECONNECT_MS = 3000;    // Start at 3 seconds
  const MAX_RECONNECT_MS = 30000;       // Cap at 30 seconds
  const BACKOFF_MULTIPLIER = 1.5;

  let socket = null;
  let pingTimer = null;
  let reconnectTimer = null;
  let currentDelay = INITIAL_RECONNECT_MS;
  let isIntentionalClose = false;

  /**
   * Updates the DOM element with the user count or fallback string
   * @param {number|string|null} count 
   */
  function updateElement(count) {
    const el = document.getElementById(ELEMENT_ID);
    if (!el) return;

    if (typeof count === "number" && !isNaN(count)) {
      el.textContent = count.toLocaleString();
      el.setAttribute("aria-label", `${count} active listeners`);
      el.setAttribute("data-status", "connected");
    } else {
      el.textContent = "—";
      el.setAttribute("aria-label", "Listener count unavailable");
      el.setAttribute("data-status", "disconnected");
    }
  }

  /**
   * Starts sending heartbeat pings every 25 seconds
   */
  function startHeartbeat() {
    stopHeartbeat();
    pingTimer = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
      }
    }, PING_INTERVAL_MS);
  }

  /**
   * Clears active heartbeat interval
   */
  function stopHeartbeat() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  /**
   * Schedules a reconnection attempt with exponential backoff
   */
  function scheduleReconnect() {
    if (reconnectTimer || isIntentionalClose) return;

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      // Exponential backoff capped at MAX_RECONNECT_MS
      currentDelay = Math.min(currentDelay * BACKOFF_MULTIPLIER, MAX_RECONNECT_MS);
      connect();
    }, currentDelay);
  }

  /**
   * Connects to the WebSocket endpoint
   */
  function connect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // Format protocol to ws/wss if http/https was supplied
    let targetUrl = WS_URL;
    if (targetUrl.startsWith("http://")) {
      targetUrl = targetUrl.replace("http://", "ws://");
    } else if (targetUrl.startsWith("https://")) {
      targetUrl = targetUrl.replace("https://", "wss://");
    }

    try {
      socket = new WebSocket(targetUrl);

      socket.onopen = () => {
        // Reset backoff delay on successful connection
        currentDelay = INITIAL_RECONNECT_MS;
        startHeartbeat();
        // Immediately ping on connect to register session
        socket.send("ping");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data.activeUsers === "number") {
            updateElement(data.activeUsers);
          }
        } catch (parseError) {
          // If non-JSON message received, safely ignore
        }
      };

      socket.onclose = () => {
        stopHeartbeat();
        updateElement(null);
        if (!isIntentionalClose) {
          scheduleReconnect();
        }
      };

      socket.onerror = () => {
        updateElement(null);
        if (socket) {
          try {
            socket.close();
          } catch (e) {}
        }
      };
    } catch (err) {
      updateElement(null);
      scheduleReconnect();
    }
  }

  // Gracefully clean up socket on page close/navigate
  window.addEventListener("beforeunload", () => {
    isIntentionalClose = true;
    stopHeartbeat();
    if (socket) {
      try {
        socket.close();
      } catch (e) {}
    }
  });

  // Automatically initiate connection once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connect);
  } else {
    connect();
  }

  // Export helper methods to window for custom UI integrations if needed
  window.LiveCounterClient = {
    connect,
    disconnect: () => {
      isIntentionalClose = true;
      stopHeartbeat();
      if (socket) socket.close();
    },
    reconnect: () => {
      isIntentionalClose = false;
      connect();
    }
  };
})();
