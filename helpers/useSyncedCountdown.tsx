import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * A React hook for creating a server-synchronized countdown timer.
 * It calculates remaining time based on wall-clock time to prevent drift.
 *
 * @param startTimeMs The server-provided start time of the countdown in milliseconds since epoch.
 * @param durationMs The total duration of the countdown in milliseconds.
 * @returns An object containing `remainingSeconds`, `remainingPercentage`, and `isExpired`.
 */
export const useSyncedCountdown = (startTimeMs: number | null | undefined, durationMs: number) => {
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const endTimeMs = useMemo(() => {
    if (!startTimeMs) return null;
    return startTimeMs + durationMs;
  }, [startTimeMs, durationMs]);

  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
    };

    // Clear any existing interval when the component unmounts or dependencies change
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Only start the interval if we have an end time
    if (endTimeMs) {
      // Initial tick to set the time immediately
      tick();
      // Set up an interval to update the time. 250ms is a good balance
      // between responsiveness and performance.
      intervalRef.current = setInterval(tick, 250);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [endTimeMs]);

  const remainingTimeMs = useMemo(() => {
    if (!endTimeMs) {
      // If the countdown hasn't started, display the full duration.
      return durationMs;
    }
    const timeLeft = endTimeMs - now;
    // Clamp the remaining time at 0.
    return Math.max(0, timeLeft);
  }, [now, endTimeMs, durationMs]);

  const remainingSeconds = Math.ceil(remainingTimeMs / 1000);
  const isExpired = !!endTimeMs && remainingTimeMs <= 0;

  const remainingPercentage = useMemo(() => {
    if (durationMs <= 0) {
      return isExpired ? 0 : 100;
    }
    const percentage = (remainingTimeMs / durationMs) * 100;
    return Math.max(0, Math.min(100, percentage));
  }, [remainingTimeMs, durationMs, isExpired]);

  return {
    remainingSeconds,
    remainingPercentage,
    isExpired,
  };
};