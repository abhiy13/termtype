import { useEffect, useState } from "react";

export function useTimer(active: boolean, intervalMs = 100): number {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (active) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, intervalMs);

      return () => {
        clearInterval(interval);
      };
    }
  }, [active, intervalMs]);

  return currentTime;
}
