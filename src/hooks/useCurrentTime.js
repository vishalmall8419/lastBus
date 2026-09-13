import { useEffect, useState } from "react";

/**
 * Real current time for the UI, locked to India Standard Time.
 * Updates every second so the clock stays live.
 */
export default function useCurrentTime() {
  const getTime = () =>
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date());

  const [time, setTime] = useState(getTime);

  useEffect(() => {
    const timer = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
}
