import useSongSearch from "../../hooks/useSongSearch";
import SongCard from "./SongCard";

export default function MusicSearch({ onPlaySong }) {
  const { query, setQuery, results, status, error, loadMore, retry, hasMore } = useSongSearch();

  return (
    <div className="flex max-h-96 flex-col">
      <div className="border-b border-night-line p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, movies…"
          aria-label="Search songs"
          autoFocus
          className="w-full rounded-md border border-night-line bg-night px-3 py-2 font-body text-sm text-cream placeholder:text-mist focus:border-amber/50 focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {status === "idle" && (
          <p className="px-4 py-6 text-center font-body text-xs text-mist">
            Search for a song, artist, or movie.
          </p>
        )}

        {status === "loading" && results.length === 0 && (
          <p className="lb-eyebrow px-4 py-6 text-center text-amber/80">Searching…</p>
        )}

        {status === "empty" && (
          <p className="px-4 py-6 text-center font-body text-xs text-mist">
            No songs found for "{query.trim()}".
          </p>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <p className="font-body text-xs text-rexine-soft">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="rounded-full border border-amber/40 px-3 py-1 font-body text-xs font-semibold text-amber transition-colors hover:bg-amber/10"
            >
              Try again
            </button>
          </div>
        )}

        {results.length > 0 && (
          <ul role="list" aria-label="Search results">
            {results.map((song) => (
              <SongCard key={song.videoId} song={song} onPlay={onPlaySong} />
            ))}
          </ul>
        )}

        {hasMore && status !== "loading" && (
          <div className="px-4 py-3 text-center">
            <button
              type="button"
              onClick={loadMore}
              className="rounded-full border border-night-line px-4 py-1.5 font-body text-xs text-mist transition-colors hover:border-amber/40 hover:text-amber"
            >
              Load more
            </button>
          </div>
        )}

        {status === "loading" && results.length > 0 && (
          <p className="lb-eyebrow px-4 py-3 text-center text-amber/80">Loading more…</p>
        )}
      </div>
    </div>
  );
}
