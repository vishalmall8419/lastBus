// Pure functions only — no React, no fetch. Kept separate from
// useSmartShuffle.js so the picking logic itself is trivially testable.
//
// HONEST LIMITATION: the architecture describes weighting picks by decade
// (90s > 80s > 2000s > modern). YouTube search results don't reliably expose
// a song's release year, so we can't actually score individual candidates by
// decade without guessing from the title text — which would be unreliable
// enough to not be worth pretending it works. The real "90s-first" mechanism
// here is the search query itself (MusicProvider's DEFAULT_QUERY and
// useRadioMode's rotation list are all "90s ..." queries), not per-song
// weighting. If/when richer metadata is available, weighting can slot into
// `pickWeightedRandom` without changing its callers.

export function pickWeightedRandom(candidates) {
  if (!candidates.length) return null;
  const i = Math.floor(Math.random() * candidates.length);
  return candidates[i];
}

/**
 * Picks a next song from `pool`, avoiding anything in `recentlyPlayedIds`
 * and the currently-playing song. Falls back to the full pool (minus the
 * current song) if every candidate has been recently played — better to
 * repeat something than to stop the radio.
 */
export function pickNextSong(pool, recentlyPlayedIds = [], excludeId = null) {
  if (!pool.length) return null;

  const fresh = pool.filter(
    (song) => song.videoId !== excludeId && !recentlyPlayedIds.includes(song.videoId)
  );
  if (fresh.length) return pickWeightedRandom(fresh);

  const anyOther = pool.filter((song) => song.videoId !== excludeId);
  return pickWeightedRandom(anyOther.length ? anyOther : pool);
}
