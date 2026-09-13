import { memo } from "react";

/**
 * BUGFIX (caught in Phase 11 review): this used to be desktop-only
 * (`hidden sm:flex`) from before the Phase 10 mobile sheet existed. Once the
 * mobile sheet started rendering this same component, that class silently
 * made the volume control invisible there too. Visibility is now controlled
 * by whichever parent renders this (the desktop bar vs. the mobile sheet),
 * not baked into the component itself — same fix already applied to
 * ShuffleButton/RepeatButton in Phase 10.
 */
function VolumeControl({ volume, isMuted, onVolumeChange, onToggleMute }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={isMuted ? "Unmute" : "Mute"}
        onClick={onToggleMute}
        className="flex h-9 w-9 items-center justify-center text-cream/70 transition-colors hover:text-amber focus-visible:text-amber"
      >
        <span aria-hidden="true">{isMuted || volume === 0 ? "🔇" : "🔊"}</span>
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={isMuted ? 0 : volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        aria-label="Volume"
        className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-night-line"
        style={{ accentColor: "#E8954C" }}
      />
    </div>
  );
}

export default memo(VolumeControl);
