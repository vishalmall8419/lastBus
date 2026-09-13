import { useRef, useEffect } from "react";
import heroSlides from "../../data/heroSlides";
import useHeroCarousel from "../../hooks/useHeroCarousel";
import HeroSlide from "./HeroSlide";
import HeroOverlay from "./HeroOverlay";
import HeroControls from "./HeroControls";
import HeroIndicators from "./HeroIndicators";
import RainEffect from "../RainEffect/RainEffect";
import "./heroCarousel.css";

const MOTION_DURATION_MS = 9000; // spans a bit past the autoplay interval so the
// crossfade never catches a slide mid-motion abruptly

export default function HeroCarousel({ onEnterJourney, onSlideChange, playerVisible, rainEnabled }) {
  const {
    index,
    next,
    prev,
    goTo,
    pause,
    resume,
    prefersReducedMotion,
    swipeHandlers,
    keyboardHandlers,
  } = useHeroCarousel(heroSlides.length);

  const activeSlide = heroSlides[index];

  // Reports the active slide upward (e.g. so TopNav's Journey Clock can show
  // this slide's time) without HeroCarousel needing to know who's listening.
  useEffect(() => {
    onSlideChange?.(activeSlide);
  }, [activeSlide, onSlideChange]);

  // Forces each slide's <img> to remount (and therefore restart its Ken Burns
  // animation) every time it becomes active again, rather than only on first
  // mount. Mutating a ref during render is intentional here — it only ever
  // drives a cosmetic animation key, never anything read elsewhere in render.
  const lastIndexRef = useRef(-1);
  const cycleCountsRef = useRef({});
  if (lastIndexRef.current !== index) {
    const activeId = heroSlides[index].id;
    cycleCountsRef.current[activeId] = (cycleCountsRef.current[activeId] || 0) + 1;
    lastIndexRef.current = index;
  }

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-night"
      role="region"
      aria-roledescription="carousel"
      aria-label="LAST BUS journey — background scenes"
      tabIndex={0}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onTouchStart={(e) => {
        pause();
        swipeHandlers.onTouchStart(e);
      }}
      onTouchEnd={(e) => {
        swipeHandlers.onTouchEnd(e);
        resume();
      }}
      onKeyDown={keyboardHandlers.onKeyDown}
    >
      {heroSlides.map((slide, i) => (
        <HeroSlide
          key={slide.id}
          slide={slide}
          isActive={i === index}
          isFirstSlide={i === 0}
          remountKey={`${slide.id}-${cycleCountsRef.current[slide.id] || 0}`}
          prefersReducedMotion={prefersReducedMotion}
          motionDurationMs={MOTION_DURATION_MS}
        />
      ))}

      <HeroOverlay slide={activeSlide} onEnterJourney={onEnterJourney} />

      <RainEffect active={rainEnabled && activeSlide.mood === "rain"} />

      <HeroControls onPrev={prev} onNext={next} count={heroSlides.length} />

      <div
        className={`pointer-events-none absolute inset-x-0 z-20 flex justify-center ${
          playerVisible ? "bottom-28 sm:bottom-44" : "bottom-14 sm:bottom-16"
        }`}
      >
        {/* Clears the marquee always. On mobile, the Music Player is now a
            short collapsed mini-bar by default (Phase 10) rather than the
            tall unified bar, so it needs much less clearance than desktop's
            full inline bar does — hence the different bottom-* per
            breakpoint. If the mobile bottom sheet is open, it covers the
            indicators entirely regardless of this offset, which is expected.
            Still a best estimate without a browser — check visually. */}
        <div className="pointer-events-auto">
          <HeroIndicators count={heroSlides.length} activeIndex={index} onSelect={goTo} />
        </div>
      </div>

      {/* Screen-reader-only announcement so slide changes are perceivable
          without relying on the visual crossfade. */}
      <p className="sr-only" aria-live="polite">
        {activeSlide.title} — {activeSlide.location}
      </p>
    </div>
  );
}
