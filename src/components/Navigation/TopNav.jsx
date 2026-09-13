import BrandMark from "./BrandMark";
import JourneyClock from "../JourneyClock/JourneyClock";
import useMusic from "../../hooks/useMusic";

/**
 * Deliberately minimal: just the brand mark, a rain toggle, and the Journey
 * Clock. There is nothing else in the app to navigate to yet (no
 * Search/Playlists screens outside the player itself), so a hamburger/menu
 * here would open onto nothing. Add real nav items when those screens exist
 * instead of building chrome for pages that don't.
 */
export default function TopNav({ journeyTime, isJourneyComplete }) {
  const { rainEnabled, toggleRainEnabled } = useMusic();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center gap-2 text-cream drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
        <BrandMark className="h-4 w-4 text-amber" />
        <span className="font-display text-sm tracking-wide sm:text-base">LAST BUS</span>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          aria-pressed={rainEnabled}
          aria-label={rainEnabled ? "Rain effect on — tap to turn off" : "Rain effect off — tap to turn on"}
          onClick={toggleRainEnabled}
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
            rainEnabled ? "text-amber" : "text-cream/40 hover:text-cream/70"
          }`}
        >
          <span aria-hidden="true">🌧️</span>
        </button>
        <JourneyClock time={journeyTime} isComplete={isJourneyComplete} />
      </div>
    </header>
  );
}
