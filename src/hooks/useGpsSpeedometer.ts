import { useState, useEffect, useRef, useCallback } from 'react';

export type SpeedUnit = 'km/h' | 'mph';
export type GpsStatus = 'requesting' | 'active' | 'stationary' | 'denied' | 'unavailable' | 'demo';

export interface GpsTelemetry {
  speedKmh: number;
  speedMph: number;
  currentSpeed: number; // in active unit
  maxSpeedKmh: number;
  maxSpeedMph: number;
  avgSpeedKmh: number;
  avgSpeedMph: number;
  heading: number | null; // degrees (0-360)
  cardinalHeading: string; // N, NE, E, SE, S, SW, W, NW
  altitude: number | null; // meters
  altitudeFeet: number | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  totalDistanceMeters: number;
  tripDistanceKm: number;
  tripDistanceMiles: number;
  status: GpsStatus;
  statusMessage: string;
  isGpsSupported: boolean;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  resetTrip: () => void;
}

/** Haversine formula to compute great-circle distance between two GPS coordinates in meters */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/** Convert degrees to cardinal compass direction */
function getCardinalDirection(deg: number | null): string {
  if (deg === null || isNaN(deg)) return '—';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return directions[index];
}

export function useGpsSpeedometer(unit: SpeedUnit = 'km/h', isEnabled = true): GpsTelemetry {
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const [status, setStatus] = useState<GpsStatus>(isSupported ? 'requesting' : 'unavailable');
  const [statusMessage, setStatusMessage] = useState<string>(
    isSupported ? 'Acquiring GPS / NavIC Satellites…' : 'GPS Geolocation not supported on this device'
  );

  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [speedMph, setSpeedMph] = useState<number>(0);
  const [maxSpeedKmh, setMaxSpeedKmh] = useState<number>(0);
  const [maxSpeedMph, setMaxSpeedMph] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);

  const [heading, setHeading] = useState<number | null>(null);
  const [altitude, setAltitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // References to compute delta distance/time if coords.speed is null
  const prevPositionRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const speedHistoryRef = useRef<number[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Toggle Demo Simulation (Explicit manual testing mode)
  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      if (!next) {
        // Switching back to real GPS: reset speed to 0 immediately
        setSpeedKmh(0);
        setSpeedMph(0);
      }
      return next;
    });
  }, []);

  // Reset Trip Stats
  const resetTrip = useCallback(() => {
    setTotalDistance(0);
    setMaxSpeedKmh(0);
    setMaxSpeedMph(0);
    speedHistoryRef.current = [];
  }, []);

  // Main Geolocation Watcher
  useEffect(() => {
    if (!isEnabled) {
      if (watchIdRef.current !== null && isSupported) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      return;
    }

    if (isDemoMode) {
      // Demo test simulation for desktop preview
      setStatus('demo');
      setStatusMessage('Simulation Mode (Test Speed)');
      let currentDemoSpeed = 68;

      demoIntervalRef.current = setInterval(() => {
        currentDemoSpeed += (Math.random() - 0.48) * 3.5;
        currentDemoSpeed = Math.max(40, Math.min(125, currentDemoSpeed));

        const kmh = Math.round(currentDemoSpeed);
        const mph = Math.round(currentDemoSpeed * 0.621371);

        setSpeedKmh(kmh);
        setSpeedMph(mph);
        setMaxSpeedKmh((prev) => Math.max(prev, kmh));
        setMaxSpeedMph((prev) => Math.max(prev, mph));
        setHeading((prev) => ((prev ?? 270) + 1.5) % 360);
        setAltitude(184);
        setAccuracy(3);
        setTotalDistance((prev) => prev + (kmh * 1000) / 3600);
      }, 1000);

      return () => {
        if (demoIntervalRef.current) {
          clearInterval(demoIntervalRef.current);
          demoIntervalRef.current = null;
        }
      };
    }

    if (!isSupported) {
      setStatus('unavailable');
      setStatusMessage('GPS not available on this browser/device');
      setSpeedKmh(0);
      setSpeedMph(0);
      return;
    }

    setStatus('requesting');
    setStatusMessage('Acquiring high-precision GPS signal…');

    const handleSuccess = (position: GeolocationPosition) => {
      const { coords, timestamp } = position;
      const lat = coords.latitude;
      const lng = coords.longitude;
      const acc = coords.accuracy;

      setLatitude(lat);
      setLongitude(lng);
      setAccuracy(Math.round(acc));

      if (coords.altitude !== null && !isNaN(coords.altitude)) {
        setAltitude(Math.round(coords.altitude));
      }

      if (coords.heading !== null && !isNaN(coords.heading)) {
        setHeading(Math.round(coords.heading));
      }

      let speedMps = coords.speed;

      // ── Precise Speed Calculation & Deadband Filter ──
      if (speedMps === null || isNaN(speedMps) || speedMps < 0) {
        // Fallback: Haversine distance over elapsed time
        if (prevPositionRef.current) {
          const dist = calculateHaversineDistance(
            prevPositionRef.current.lat,
            prevPositionRef.current.lng,
            lat,
            lng
          );
          const timeDiffSeconds = (timestamp - prevPositionRef.current.time) / 1000;

          // Only calculate if time difference is reasonable (> 0.5s) and not a huge GPS jump (> 50m accuracy error)
          if (timeDiffSeconds >= 0.5 && acc <= 50) {
            speedMps = dist / timeDiffSeconds;
            // Strict stationary threshold: GPS jitter < 0.6 m/s (~2.16 km/h) is strictly 0
            if (speedMps > 0.6 && dist > 1.5) {
              setTotalDistance((prev) => prev + dist);
            } else {
              speedMps = 0;
            }
          } else {
            speedMps = 0;
          }
        } else {
          speedMps = 0;
        }
      } else {
        // Direct Doppler speed reported by GPS chipset
        if (prevPositionRef.current) {
          const dist = calculateHaversineDistance(
            prevPositionRef.current.lat,
            prevPositionRef.current.lng,
            lat,
            lng
          );
          if (speedMps > 0.6) {
            setTotalDistance((prev) => prev + dist);
          }
        }
      }

      prevPositionRef.current = { lat, lng, time: timestamp };

      // Strictly zero out stationary drift to avoid fake moving values
      if (speedMps < 0.6) {
        speedMps = 0;
      }

      const kmh = Math.round(speedMps * 3.6);
      const mph = Math.round(speedMps * 2.23694);

      setSpeedKmh(kmh);
      setSpeedMph(mph);

      if (kmh > 0) {
        setMaxSpeedKmh((prev) => Math.max(prev, kmh));
        setMaxSpeedMph((prev) => Math.max(prev, mph));
        speedHistoryRef.current.push(kmh);
        setStatus('active');
        setStatusMessage(`GPS Active · Accuracy ±${Math.round(acc)}m`);
      } else {
        setStatus('stationary');
        setStatusMessage(`GPS Fix Acquired · Stationary (±${Math.round(acc)}m)`);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setStatus('denied');
          setStatusMessage('Location permission denied. Enable GPS in browser settings.');
          break;
        case error.POSITION_UNAVAILABLE:
          setStatus('unavailable');
          setStatusMessage('GPS position unavailable. Check device location.');
          break;
        case error.TIMEOUT:
          setStatus('requesting');
          setStatusMessage('GPS signal searching… Waiting for satellite lock.');
          break;
        default:
          setStatus('unavailable');
          setStatusMessage('GPS signal inactive.');
          break;
      }
      setSpeedKmh(0);
      setSpeedMph(0);
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        options
      );
    } catch {
      setStatus('unavailable');
      setStatusMessage('Could not initialize GPS hardware tracking.');
    }

    return () => {
      if (watchIdRef.current !== null && isSupported) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isEnabled, isDemoMode, isSupported]);

  // Compute average speed from recorded moving sessions
  const avgKmh =
    speedHistoryRef.current.length > 0
      ? Math.round(
          speedHistoryRef.current.reduce((a, b) => a + b, 0) /
            speedHistoryRef.current.length
        )
      : 0;
  const avgMph = Math.round(avgKmh * 0.621371);

  const currentSpeed = unit === 'km/h' ? speedKmh : speedMph;

  return {
    speedKmh,
    speedMph,
    currentSpeed,
    maxSpeedKmh,
    maxSpeedMph,
    avgSpeedKmh: avgKmh,
    avgSpeedMph: avgMph,
    heading,
    cardinalHeading: getCardinalDirection(heading),
    altitude,
    altitudeFeet: altitude !== null ? Math.round(altitude * 3.28084) : null,
    latitude,
    longitude,
    accuracyMeters: accuracy,
    totalDistanceMeters: totalDistance,
    tripDistanceKm: Number((totalDistance / 1000).toFixed(2)),
    tripDistanceMiles: Number(((totalDistance / 1000) * 0.621371).toFixed(2)),
    status,
    statusMessage,
    isGpsSupported: isSupported,
    isDemoMode,
    toggleDemoMode,
    resetTrip,
  };
}
