import { memo } from "react";

/**
 * Memoized for when the results list re-renders without this particular
 * item changing (e.g. new results appended). Note this is a partial win:
 * `onPlay` is currently passed down as a fresh inline arrow function each
 * render (see MusicPlayer -> MusicSearch), so it doesn't yet have the same
 * full stability guarantee as NowPlaying/PlayerControls' props. Search
 * results aren't on the same hot path as the always-mounted player controls
 * though (the search panel is only open during an infrequent user action,
 * not re-rendered every progress tick), so this wasn't worth the extra
 * prop-threading to fully close that gap in this pass — noted honestly
 * rather than left unmentioned.
 */
function SongCard({ song, onPlay }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPlay(song)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-night-line/60"
      >
        <img
          src={song.thumbnail}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-10 w-10 flex-shrink-0 rounded object-cover"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-body text-sm text-cream">{song.title}</span>
          <span className="block truncate font-body text-xs text-mist">{song.channelTitle}</span>
        </span>
        <span aria-hidden="true" className="flex-shrink-0 text-amber/70">▶</span>
      </button>
    </li>
  );
}

export default memo(SongCard);
