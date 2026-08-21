import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_WS_URL = 'wss://live-counter.coderlade.workers.dev';
const PING_INTERVAL_MS = 25000;
const INITIAL_RECONNECT_MS = 3000;
const MAX_RECONNECT_MS = 30000;
const BACKOFF_MULTIPLIER = 1.5;

export interface UseLiveCounterResult {
  activeUsers: number | null;
  status: 'connected' | 'connecting' | 'disconnected';
  reconnect: () => void;
}

/**
 * Custom React hook to connect to the Cloudflare Worker LiveCounter Durable Object
 */
export function useLiveCounter(customWsUrl?: string): UseLiveCounterResult {
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  const wsUrl =
    customWsUrl ||
    (typeof window !== 'undefined' && (window as any).LIVE_COUNTER_WS_URL) ||
    ((import.meta as any).env?.VITE_LIVE_COUNTER_WS_URL as string) ||
    DEFAULT_WS_URL;
  
  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffDelayRef = useRef<number>(INITIAL_RECONNECT_MS);
  const isUnmountedRef = useRef<boolean>(false);

  const stopHeartbeat = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    pingTimerRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send('ping');
        } catch {
          // Ignore
        }
      }
    }, PING_INTERVAL_MS);
  }, [stopHeartbeat]);

  const cleanupSocket = useCallback(() => {
    stopHeartbeat();
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      } catch {
        // Ignore
      }
      wsRef.current = null;
    }
  }, [stopHeartbeat]);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;
    cleanupSocket();

    let targetUrl = wsUrl;
    if (targetUrl.startsWith('http://')) {
      targetUrl = targetUrl.replace('http://', 'ws://');
    } else if (targetUrl.startsWith('https://')) {
      targetUrl = targetUrl.replace('https://', 'wss://');
    }

    setStatus('connecting');

    try {
      const socket = new WebSocket(targetUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isUnmountedRef.current) return;
        setStatus('connected');
        backoffDelayRef.current = INITIAL_RECONNECT_MS;
        startHeartbeat();
        try {
          socket.send('ping');
        } catch {
          // Ignore
        }
      };

      socket.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data.activeUsers === 'number') {
            setActiveUsers(data.activeUsers);
          }
        } catch {
          // Non-JSON message like pong
        }
      };

      socket.onclose = () => {
        if (isUnmountedRef.current) return;
        setStatus('disconnected');
        setActiveUsers(null);
        stopHeartbeat();
        scheduleReconnect();
      };

      socket.onerror = () => {
        if (isUnmountedRef.current) return;
        setStatus('disconnected');
        setActiveUsers(null);
        try {
          socket.close();
        } catch {
          // Ignore
        }
      };
    } catch {
      setStatus('disconnected');
      setActiveUsers(null);
      scheduleReconnect();
    }
  }, [wsUrl, cleanupSocket, startHeartbeat]);

  const scheduleReconnect = useCallback(() => {
    if (isUnmountedRef.current || reconnectTimerRef.current) return;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      backoffDelayRef.current = Math.min(
        backoffDelayRef.current * BACKOFF_MULTIPLIER,
        MAX_RECONNECT_MS
      );
      connect();
    }, backoffDelayRef.current);
  }, [connect]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isUnmountedRef.current = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanupSocket();
    };
  }, [connect, cleanupSocket]);

  return {
    activeUsers,
    status,
    reconnect: connect,
  };
}
