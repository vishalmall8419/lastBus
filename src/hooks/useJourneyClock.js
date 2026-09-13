import { useEffect, useRef, useState } from "react";

// Each checkpoint pairs a simulated time with a narrative mood, so the
// journey has a shape: midnight -> a dhaba stop -> more night -> dawn.
// Mood keys match utils/moodToPlaylistMap.js's playlist mapping so the
// same suggestion mechanism the Hero uses can react to clock progression
// too, without needing a second, separate suggestion system.
const JOURNEY_STEPS = [
  { time: "11:47 PM", mood: "midnight" },
  { time: "12:15 AM", mood: "midnight" },
  { time: "1:05 AM", mood: "dhaba" },
  { time: "2:20 AM", mood: "midnight" },
  { time: "4:45 AM", mood: "dawn" },
  { time: "5:30 AM", mood: "dawn" },
];

const STEP_INTERVAL_MS = 45000; // ~45s of real time per simulated checkpoint

/**
 * A simulated journey clock — explicitly NOT a real-time tracker (per the
 * architecture's Journey Clock note: "a visual simulation, not a real-world
 * trip tracker"). While `isActive` is false, it stays parked at the first
 * checkpoint and runs no timer at all. Once active (a journey has actually
 * started), it advances one checkpoint at a time and stops at the last one
 * rather than looping — a bus journey has an end, unlike the Hero carousel.
 */
export default function useJourneyClock(isActive) {
  const [stepIndex, setStepIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      clearInterval(timerRef.current);
      return undefined;
    }
    timerRef.current = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, JOURNEY_STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  const current = JOURNEY_STEPS[stepIndex];

  return {
    time: current.time,
    mood: current.mood,
    stepIndex,
    isJourneyComplete: stepIndex === JOURNEY_STEPS.length - 1,
  };
}
