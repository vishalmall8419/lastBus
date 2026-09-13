import { memo } from "react";

/**
 * Memoized: `song` only changes when the track actually changes, not on
 * every progress-bar tick — without this, NowPlaying re-renders every 500ms
 * along with the rest of MusicPlayer for no visual reason.
 */
function NowPlaying({ song }) {
  if (!song) return null;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <img
        src={song.thumbnail}
        alt=""
        aria-hidden="true"
        className="h-11 w-11 flex-shrink-0 rounded-md object-cover"
      />
      <div className="min-w-0 text-left">
        <p className="truncate font-body text-sm font-semibold text-cream sm:text-base">
          {song.title}
        </p>
        <p className="truncate font-body text-xs text-mist">{song.channelTitle}</p>
      </div>
    </div>
  );
}

export default memo(NowPlaying);
