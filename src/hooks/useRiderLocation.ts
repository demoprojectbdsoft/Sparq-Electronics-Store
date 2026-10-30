"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { shareLocationAction } from "@/lib/action/deliveries";

/**
 * Shares the rider's position while a job is live.
 *
 * Free and serverless: the browser's own geolocation API feeds a normal write,
 * and the customer's tracking page polls for it. There is no socket and no paid
 * map service anywhere in the path.
 *
 * Two rules keep it honest and cheap: a fix is only sent every 15 seconds, and
 * the watch stops the moment the rider switches it off or the screen unmounts.
 */

const MIN_INTERVAL_MS = 15_000;

export function useRiderLocation(deliveryId: string | null) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState("");
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const [points, setPoints] = useState(0);

  const watchRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);

  const stop = useCallback(() => {
    if (watchRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    watchRef.current = null;
    setIsSharing(false);
  }, []);

  const start = useCallback(() => {
    if (!deliveryId) return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This browser cannot share a location");
      return;
    }

    setError("");
    lastSentRef.current = 0;

    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSentRef.current < MIN_INTERVAL_MS) return;
        lastSentRef.current = now;

        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        shareLocationAction(deliveryId, {
          lat: latitude,
          lng: longitude,
          accuracy: Number.isFinite(accuracy) ? accuracy : undefined,
          heading: heading !== null && Number.isFinite(heading) ? heading : undefined,
          speed: speed !== null && Number.isFinite(speed) ? speed : undefined,
        })
          .then((res) => {
            if (res?.success === false) {
              setError(res?.message || "The location could not be sent");
              return;
            }
            setLastSentAt(new Date().toISOString());
            setPoints((count) => count + 1);
          })
          .catch(() => setError("The location could not be sent"));
      },
      (err) => {
        // A refused permission is final: stop watching rather than retry.
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Allow it in your browser settings to share."
            : "Your position is unavailable right now"
        );
        if (err.code === err.PERMISSION_DENIED) stop();
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 }
    );

    setIsSharing(true);
  }, [deliveryId, stop]);

  const toggle = useCallback(() => {
    if (isSharing) stop();
    else start();
  }, [isSharing, start, stop]);

  // Leaving the screen must not leave the phone reporting.
  useEffect(() => stop, [stop]);

  return { isSharing, error, lastSentAt, points, start, stop, toggle };
}
