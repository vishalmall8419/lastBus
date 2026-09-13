import { memo } from "react";

/**
 * Memoized: with advanceForward's dependency array narrowed (Phase 11),
 * onNext/onPrev/onTogglePlay stay referentially stable across progress-bar
 * ticks, so this actually skips re-rendering rather than only appearing to.
 */
function PlayerControls({ isPlaying, onTogglePlay, onNext, onPrev }) {
  const iconButton =
    "flex h-11 w-11 items-center justify-center rounded-full text-cream/85 transition-colors hover:text-amber focus-visible:text-amber";

  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="Previous song" onClick={onPrev} className={iconButton}>
        <span aria-hidden="true" className="text-lg">⏮</span>
      </button>
      <button
        type="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        onClick={onTogglePlay}
        className={`${iconButton} h-12 w-12 border border-amber/40 bg-amber/10 text-amber`}
      >
        <span aria-hidden="true" className="text-lg">{isPlaying ? "⏸" : "▶"}</span>
      </button>
      <button type="button" aria-label="Next song" onClick={onNext} className={iconButton}>
        <span aria-hidden="true" className="text-lg">⏭</span>
      </button>
    </div>
  );
}

export default memo(PlayerControls);
