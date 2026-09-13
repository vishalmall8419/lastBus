import playlistConfigs from "../../data/playlistConfigs";

/**
 * Selecting a playlist here is always an explicit action, so it's allowed
 * to switch immediately — unlike the Hero's passive mood suggestions, which
 * only ever suggest (see utils/moodToPlaylistMap.js).
 */
export default function PlaylistSelector({ selectedMood, onSelect }) {
  return (
    <ul className="max-h-72 overflow-y-auto py-1" role="list" aria-label="Playlists">
      {Object.entries(playlistConfigs).map(([key, config]) => {
        const isActive = key === selectedMood;
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onSelect(key)}
              aria-current={isActive ? "true" : undefined}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-night-line/60 ${
                isActive ? "bg-night-line/40" : ""
              }`}
            >
              <span className="text-base" aria-hidden="true">{config.emoji}</span>
              <span className={`flex-1 font-body text-sm ${isActive ? "text-amber" : "text-cream"}`}>
                {config.title}
              </span>
              {isActive && <span className="lb-eyebrow text-amber">playing</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
