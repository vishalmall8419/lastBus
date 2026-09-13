import { memo } from "react";

/**
 * A single hero slide. Purely presentational — all timing/pause/crossfade
 * decisions live in HeroCarousel + useHeroCarousel. `remountKey` changes every
 * time this slide re-becomes active, which forces React to recreate the <img>
 * node so its Ken Burns animation restarts from the beginning rather than
 * jumping to its end state on a loop.
 *
 * Memoized (Phase 11): with 5 slides all mounted simultaneously for the
 * crossfade, memoizing means an index change only re-renders the (at most
 * two) slides whose `isActive`/`remountKey` actually changed, not all five.
 *
 * `isFirstSlide` gets `fetchPriority="high"` for LCP — the other four
 * deliberately do NOT get `loading="lazy"`: because all five are absolutely
 * positioned to fill the same viewport-sized container for the crossfade
 * technique, they're all technically "in viewport" simultaneously, so
 * native lazy-loading's intersection-based heuristic wouldn't actually defer
 * anything here. Claiming `loading="lazy"` would do something in this
 * specific layout would be inaccurate, so it's left out rather than added
 * as a checkbox that doesn't function.
 */
function HeroSlide({ slide, isActive, isFirstSlide, remountKey, prefersReducedMotion, motionDurationMs }) {
  return (
    <div
      className="absolute inset-0 transition-opacity ease-in-out"
      style={{
        opacity: isActive ? 1 : 0,
        transitionDuration: prefersReducedMotion ? "400ms" : "1200ms",
      }}
      aria-hidden={!isActive}
    >
      <img
        key={remountKey}
        src={slide.image}
        alt={`${slide.title} — ${slide.subtitle}`}
        className="hero-slide-img"
        data-motion={prefersReducedMotion ? undefined : slide.kenBurns}
        fetchPriority={isFirstSlide ? "high" : undefined}
        loading={isFirstSlide ? "eager" : undefined}
        style={{
          "--pos-mobile": slide.mobilePosition,
          "--pos-desktop": slide.desktopPosition,
          "--motion-duration": `${motionDurationMs}ms`,
        }}
        draggable={false}
      />
    </div>
  );
}

export default memo(HeroSlide);
