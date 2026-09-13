import { useEffect } from "react";
import playlistConfigs from "../../data/playlistConfigs";

const AUTO_DISMISS_MS = 9000;

/**
 * Only ever a suggestion — see resolveMoodChange() in
 * utils/moodToPlaylistMap.js, which is what decides whether this even
 * renders. It never switches anything on its own; "Switch" is the one path
 * that calls selectMood(), and that's an explicit tap.
 */
export default function MoodSuggestion({ playlistKey, onSwitch, onDismiss }) {
  const config = playlistConfigs[playlistKey];

  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [playlistKey, onDismiss]);

  if (!config) return null;

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber/40 bg-night-panel/90 py-1.5 pl-3 pr-1.5 shadow-lg backdrop-blur-sm"
    >
      <span className="font-body text-xs text-cream/90">
        <span aria-hidden="true">{config.emoji}</span> Switch to {config.title}?
      </span>
      <button
        type="button"
        onClick={onSwitch}
        className="rounded-full bg-amber/15 px-3 py-1 font-body text-xs font-semibold text-amber transition-colors hover:bg-amber/25"
      >
        Switch
      </button>
      <button
        type="button"
        aria-label="Dismiss suggestion"
        onClick={onDismiss}
        className="px-1.5 font-body text-xs text-mist hover:text-cream"
      >
        ✕
      </button>
    </div>
  );
}
