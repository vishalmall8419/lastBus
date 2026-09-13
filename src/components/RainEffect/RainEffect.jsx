import { useEffect, useMemo, useState } from "react";
import "./rainEffect.css";

const DROP_COUNT = 42; // enough to read as rain, not enough to cost anything on mobile

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
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
 * Purely decorative rain overlay. `active` is expected to already combine
 * "the current hero mood is rain" AND "the person hasn't turned rain off"
 * (see HeroCarousel) — this component doesn't make that decision itself,
 * it just renders or doesn't.
 *
 * Under prefers-reduced-motion, it renders nothing at all rather than a
 * frozen mid-fall frame — a static streak would read as a glitch, not a
 * deliberate still image, unlike the Hero's Ken Burns freeze.
 */
export default function RainEffect({ active }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const drops = useMemo(
    () =>
      Array.from({ length: DROP_COUNT }, (_, i) => {
        const duration = 0.7 + Math.random() * 0.7; // 0.7s - 1.4s
        return {
          id: i,
          left: Math.random() * 100,
          duration,
          delay: -Math.random() * duration, // negative delay = already mid-fall on mount
          opacity: 0.3 + Math.random() * 0.4,
          height: 50 + Math.random() * 40,
        };
      }),
    []
  );

  if (prefersReducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden transition-opacity duration-1000"
      style={{ opacity: active ? 1 : 0 }}
    >
      {drops.map((drop) => (
        <span
          key={drop.id}
          className="rain-drop"
          style={{
            left: `${drop.left}%`,
            height: `${drop.height}px`,
            opacity: drop.opacity,
            animationDuration: `${drop.duration}s`,
            animationDelay: `${drop.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
