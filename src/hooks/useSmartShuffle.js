import { useCallback, useRef } from "react";
import { pickNextSong } from "../utils/shuffle";

const HISTORY_LIMIT = 15; // how many recently-played IDs we avoid repeating

/**
 * Wraps the pure shuffle logic with a recently-played ring buffer. The
 * buffer lives in a ref (not component state) because it's an implementation
 * detail of picking, not something any UI needs to re-render on — the
 * visible "history" for the Queue panel is tracked separately, in
 * MusicProvider's reducer state.
 *
 * Now persisted (Phase 8): MusicProvider calls `hydrate()` once on mount
 * with whatever was saved to LocalStorage, so a page refresh doesn't give
 * Smart Shuffle a completely clean slate — the last ~30 played songs are
 * still avoided for a bit even across reloads.
 */
export default function useSmartShuffle() {
  const recentRef = useRef([]);

  const remember = useCallback((videoId) => {
    if (!videoId) return;
    recentRef.current = [videoId, ...recentRef.current.filter((id) => id !== videoId)].slice(
      0,
      HISTORY_LIMIT
    );
  }, []);

  const hydrate = useCallback((ids) => {
    if (Array.isArray(ids) && ids.length) {
      recentRef.current = ids.slice(0, HISTORY_LIMIT);
    }
  }, []);

  const pickNext = useCallback((pool, excludeId) => {
    return pickNextSong(pool, recentRef.current, excludeId);
  }, []);

  return { pickNext, remember, hydrate };
}
