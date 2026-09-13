import { memo } from "react";

/**
 * Per-song copyright/attribution notice. Renders below the main player
 * controls, updates automatically because it just reads `song` straight
 * from MusicProvider's currentSong — no separate state to keep in sync.
 * Memoized (Phase 11): `song` only changes on track change, not on every
 * progress-bar tick.
 *
 * IMPORTANT — what this can and can't claim:
 * The YouTube Data API's search results give us a video title and the
 * uploading channel's name — nothing structured for singer/composer/
 * lyricist/movie/label. The channel is often (not always) the rights
 * holder or an authorized label channel, but we cannot verify that from
 * search metadata alone, so it's presented as "channel", not asserted as
 * "artist" or "copyright owner". Ownership itself is always phrased as
 * "respective copyright owners" rather than attributed to the channel,
 * LAST BUS, or YouTube — none of whom this component claims owns the work.
 */
function SongAttribution({ song }) {
  if (!song) return null;

  return (
    <p className="mt-1.5 truncate text-center font-body text-[11px] leading-tight text-mist/80 sm:text-xs">
      <span className="block truncate">
        🎵 {song.title}
        {song.channelTitle ? ` — ${song.channelTitle}` : ""}
      </span>
      <span className="block text-mist/60">
        © Respective copyright owners • Playback via YouTube
      </span>
    </p>
  );
}

export default memo(SongAttribution);
