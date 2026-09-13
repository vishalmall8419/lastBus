import { useEffect, useState } from "react";

/**
 * Hero overlay for LAST BUS.
 * The time shown here is always the real current India Standard Time (IST),
 * updated every second. The slide's location is kept dynamic while its
 * hard-coded journey time is ignored.
 */
export default function HeroOverlay({ slide, onEnterJourney }) {
  const getCurrentTime = () =>
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date());

  const [currentTime, setCurrentTime] = useState(getCurrentTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Readability gradient: dark top (for the nav bar) -> lighter mid -> dark bottom */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,6,10,0.35) 0%, rgba(5,6,10,0.15) 22%, rgba(5,6,10,0.25) 45%, rgba(5,6,10,0.85) 100%)",
        }}
      />

      <div className="hero-vignette z-10" />
      <div className="hero-grain z-10" />

      <div className="relative z-20 flex min-h-[100vh] flex-col items-center justify-end px-6 pb-28 text-center sm:pb-32">
        <div key={slide.id} className="hero-content-fade flex flex-col items-center">
          <p className="lb-eyebrow text-amber/90 sm:text-sm">
            {slide.location.split("•")[0].trim()} • {currentTime}
          </p>

          <h1 className="mt-3 font-display text-5xl leading-none text-cream drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-7xl md:text-8xl">
            {slide.title}
          </h1>

          <p className="mt-4 max-w-xs font-body text-sm text-cream/85 sm:max-w-md sm:text-base">
            {slide.subtitle}
          </p>

          <button
            type="button"
            aria-label="Enter the journey"
            onClick={onEnterJourney}
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-amber/50 bg-night-panel/50 px-6 py-3 font-body text-sm font-semibold tracking-wide text-amber backdrop-blur-sm transition-colors hover:bg-amber/10 focus-visible:bg-amber/10 sm:px-8 sm:py-4 sm:text-base"
          >
            <span aria-hidden="true">▶</span> Enter Journey
          </button>
        </div>
      </div>
    </>
  );
}
