/**
 * Shows recently-played history rather than a predicted "up next" list.
 * With Smart Shuffle, the next song is only actually chosen when the
 * current one ends (or Next is pressed) — precomputing a prediction would
 * either be thrown away most of the time or force picks to happen earlier
 * than they should. History is honest: it's exactly what played.
 */
export default function Queue({ history, historyIndex, onSelect }) {
  if (history.length <= 1) {
    return (
      <p className="px-4 py-3 text-center font-body text-xs text-mist">
        History will show up here once more songs have played.
      </p>
    );
  }

  // Most recent first, excluding nothing — the current song is highlighted.
  const ordered = history.map((song, i) => ({ song, index: i })).reverse();

  return (
    <ul className="max-h-64 overflow-y-auto py-1" role="list" aria-label="Recently played">
      {ordered.map(({ song, index }) => {
        const isCurrent = index === historyIndex;
        return (
          <li key={`${song.videoId}-${index}`}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={isCurrent ? "true" : undefined}
              className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-night-line/60 ${
                isCurrent ? "bg-night-line/40" : ""
              }`}
            >
              <img
                src={song.thumbnail}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="h-8 w-8 flex-shrink-0 rounded object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-body text-xs text-cream">{song.title}</span>
                <span className="block truncate font-body text-[11px] text-mist">{song.channelTitle}</span>
              </span>
              {isCurrent && <span className="lb-eyebrow flex-shrink-0 text-amber">now</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
