import { useState, useEffect, useRef, useCallback } from "react";

const AUTOPLAY_MS = 8000; // "natural, not distracting" per the brief — 6-10s range
const SWIPE_THRESHOLD_PX = 50;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

/**
 * Drives the Hero Carousel: autoplay + loop, manual next/prev/goTo (each of which
 * resets the autoplay timer), pause-on-interaction, swipe gesture detection, and
 * a `prefersReducedMotion` flag the visual layer uses to drop Ken Burns/crossfade
 * intensity. Autoplay is intentionally NOT started at all when reduced motion is
 * requested — under that preference the carousel is fully manual (dots/arrows/
 * swipe/keyboard still work).
 */
export default function useHeroCarousel(slideCount, autoplayMs = AUTOPLAY_MS) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const timerRef = useRef(null);
  const touchStartX = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (prefersReducedMotion || isPaused || slideCount <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slideCount);
    }, autoplayMs);
  }, [autoplayMs, clearTimer, isPaused, prefersReducedMotion, slideCount]);

  // Mount -> start timer. Unmount -> clear it. Also restarts whenever the
  // dependencies driving it change (pause state, reduced-motion preference).
  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const goTo = useCallback(
    (nextIndex) => {
      setIndex(((nextIndex % slideCount) + slideCount) % slideCount);
      startTimer(); // manual change resets the automatic interval
    },
    [slideCount, startTimer]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  const onTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      if (touchStartX.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
        deltaX < 0 ? next() : prev();
      }
      touchStartX.current = null;
    },
    [next, prev]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    },
    [next, prev]
  );

  return {
    index,
    next,
    prev,
    goTo,
    pause,
    resume,
    isPaused,
    prefersReducedMotion,
    swipeHandlers: { onTouchStart, onTouchEnd },
    keyboardHandlers: { onKeyDown },
  };
}
