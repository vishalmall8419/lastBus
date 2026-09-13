import { useState } from "react";
import useMusic from "../../hooks/useMusic";
import playlistConfigs from "../../data/playlistConfigs";
import NowPlaying from "./NowPlaying";
import PlayerControls from "./PlayerControls";
import ProgressBar from "./ProgressBar";
import VolumeControl from "./VolumeControl";
import RepeatButton from "./RepeatButton";
import ShuffleButton from "./ShuffleButton";
import RadioModeToggle from "./RadioMode";
import Queue from "./Queue";
import PlaylistSelector from "./PlaylistSelector";
import MusicSearch from "./MusicSearch";
import SongAttribution from "./SongAttribution";

/**
 * Two different layouts sharing one set of context values and one
 * `openPanel` state (Queue/Playlist/Search), chosen purely via Tailwind
 * breakpoints — no JS viewport detection needed:
 *
 * - Mobile (<640px): a persistent collapsed mini-bar (art, title, play,
 *   next — the priority order from the brief) that expands into a bottom
 *   sheet on tap, where Queue/Playlist/Search become a drill-down "screen"
 *   inside the same sheet rather than a separate floating panel.
 * - Desktop/tablet (>=640px): the existing single-row bar with floating
 *   panels above it, unchanged from Phase 4-7.
 *
 * Renders nothing until a journey has actually started.
 */
export default function MusicPlayer() {
  const [openPanel, setOpenPanel] = useState(null); // "queue" | "playlist" | "search" | null
  const [isSheetOpen, setIsSheetOpen] = useState(false); // mobile only
  const {
    playerStatus,
    errorMessage,
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    isRadioMode,
    selectedMood,
    history,
    historyIndex,
    togglePlay,
    next,
    prev,
    setVolume,
    toggleMute,
    setRepeatMode,
    toggleShuffle,
    toggleRadioMode,
    selectMood,
    goToHistoryIndex,
    playSongNow,
    seekTo,
    startJourney,
  } = useMusic();

  if (playerStatus === "idle") return null;

  const togglePanel = (name) => setOpenPanel((v) => (v === name ? null : name));
  const closeSheet = () => {
    setIsSheetOpen(false);
    setOpenPanel(null);
  };
  const activeConfig = playlistConfigs[selectedMood] || playlistConfigs.busRadio;
  const isReady = playerStatus === "playing" || playerStatus === "paused" || playerStatus === "ready";

  return (
    <>
      {(playerStatus === "loading" || playerStatus === "error") && (
        <div className="fixed inset-x-0 bottom-9 z-30 border-t border-night-line bg-night-panel/90 px-4 py-3 backdrop-blur-md sm:bottom-10 sm:px-6">
          {playerStatus === "loading" && (
            <p className="lb-eyebrow text-center text-amber/80">Tuning in the radio…</p>
          )}
          {playerStatus === "error" && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-center">
              <p className="font-body text-sm text-rexine-soft">{errorMessage}</p>
              <button
                type="button"
                onClick={startJourney}
                className="rounded-full border border-amber/40 px-4 py-1.5 font-body text-xs font-semibold text-amber transition-colors hover:bg-amber/10"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {isReady && currentSong && (
        <>
          {/* ---------- MOBILE: collapsed mini-bar ---------- */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Open Now Playing"
            aria-haspopup="dialog"
            onClick={() => setIsSheetOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsSheetOpen(true);
              }
            }}
            className="fixed inset-x-0 bottom-9 z-30 flex cursor-pointer items-center gap-3 border-t border-night-line bg-night-panel/95 px-3 py-2 backdrop-blur-md sm:hidden"
          >
            <img
              src={currentSong.thumbnail}
              alt=""
              aria-hidden="true"
              className="h-10 w-10 flex-shrink-0 rounded object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-sm text-cream">{currentSong.title}</span>
              <span className="block truncate font-body text-xs text-mist">{currentSong.channelTitle}</span>
            </span>
            <button
              type="button"
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-amber/40 bg-amber/10 text-amber"
            >
              <span aria-hidden="true">{isPlaying ? "⏸" : "▶"}</span>
            </button>
            <button
              type="button"
              aria-label="Next song"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-cream/80"
            >
              <span aria-hidden="true">⏭</span>
            </button>
          </div>

          {/* ---------- MOBILE: expanded bottom sheet ---------- */}
          {isSheetOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-night/70 backdrop-blur-sm sm:hidden"
                onClick={closeSheet}
                aria-hidden="true"
              />
              <div
                className="fixed inset-x-0 bottom-9 z-40 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-night-line bg-night-panel px-4 pb-5 pt-3 sm:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Now Playing"
              >
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-night-line" aria-hidden="true" />

                <div className="mb-3 flex items-center justify-between">
                  {openPanel ? (
                    <button
                      type="button"
                      onClick={() => setOpenPanel(null)}
                      className="flex items-center gap-1 font-body text-xs text-mist hover:text-cream"
                    >
                      <span aria-hidden="true">‹</span> Back
                    </button>
                  ) : (
                    <span className="lb-eyebrow">Now Playing</span>
                  )}
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={closeSheet}
                    className="text-mist hover:text-cream"
                  >
                    ✕
                  </button>
                </div>

                {openPanel === "queue" && (
                  <Queue
                    history={history}
                    historyIndex={historyIndex}
                    onSelect={(i) => {
                      goToHistoryIndex(i);
                      closeSheet();
                    }}
                  />
                )}

                {openPanel === "playlist" && (
                  <PlaylistSelector
                    selectedMood={selectedMood}
                    onSelect={(key) => {
                      selectMood(key);
                      closeSheet();
                    }}
                  />
                )}

                {openPanel === "search" && (
                  <MusicSearch
                    onPlaySong={(song) => {
                      playSongNow(song);
                      closeSheet();
                    }}
                  />
                )}

                {!openPanel && (
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={currentSong.thumbnail}
                      alt=""
                      aria-hidden="true"
                      className="h-40 w-40 rounded-lg object-cover shadow-lg"
                    />
                    <div className="text-center">
                      <p className="font-body text-base font-semibold text-cream">{currentSong.title}</p>
                      <p className="font-body text-sm text-mist">{currentSong.channelTitle}</p>
                    </div>

                    <div className="w-full">
                      <ProgressBar progress={progress} duration={duration} onSeek={seekTo} />
                    </div>

                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        aria-label="Previous song"
                        onClick={prev}
                        className="flex h-12 w-12 items-center justify-center text-2xl text-cream/85"
                      >
                        <span aria-hidden="true">⏮</span>
                      </button>
                      <button
                        type="button"
                        aria-label={isPlaying ? "Pause" : "Play"}
                        onClick={togglePlay}
                        className="flex h-16 w-16 items-center justify-center rounded-full border border-amber/40 bg-amber/10 text-2xl text-amber"
                      >
                        <span aria-hidden="true">{isPlaying ? "⏸" : "▶"}</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Next song"
                        onClick={next}
                        className="flex h-12 w-12 items-center justify-center text-2xl text-cream/85"
                      >
                        <span aria-hidden="true">⏭</span>
                      </button>
                    </div>

                    <div className="grid w-full grid-cols-5 gap-2">
                      <RadioModeToggle isRadioMode={isRadioMode} onToggle={toggleRadioMode} />
                      <ShuffleButton isShuffled={isShuffled} onToggle={toggleShuffle} />
                      <RepeatButton repeatMode={repeatMode} onCycle={setRepeatMode} />
                      <button
                        type="button"
                        aria-label="Playlists"
                        onClick={() => setOpenPanel("playlist")}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-cream/60 hover:text-cream/90"
                      >
                        <span aria-hidden="true">{activeConfig.emoji}</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Search songs"
                        onClick={() => setOpenPanel("search")}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-cream/60 hover:text-cream/90"
                      >
                        <span aria-hidden="true">🔍</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenPanel("queue")}
                      className="font-body text-xs text-mist hover:text-cream"
                    >
                      🕘 Recently played
                    </button>

                    <VolumeControl
                      volume={volume}
                      isMuted={isMuted}
                      onVolumeChange={setVolume}
                      onToggleMute={toggleMute}
                    />

                    <SongAttribution song={currentSong} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ---------- DESKTOP/TABLET: unchanged inline bar ---------- */}
          <div className="fixed inset-x-0 bottom-9 z-30 hidden border-t border-night-line bg-night-panel/90 px-4 pb-2 pt-3 backdrop-blur-md sm:block sm:bottom-10 sm:px-6">
            <div className="relative mx-auto max-w-3xl">
              {openPanel === "queue" && (
                <div className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-lg border border-night-line bg-night-panel shadow-lg">
                  <div className="flex items-center justify-between border-b border-night-line px-4 py-2">
                    <span className="lb-eyebrow">Recently Played</span>
                    <button
                      type="button"
                      aria-label="Close history"
                      onClick={() => setOpenPanel(null)}
                      className="text-mist hover:text-cream"
                    >
                      ✕
                    </button>
                  </div>
                  <Queue
                    history={history}
                    historyIndex={historyIndex}
                    onSelect={(i) => {
                      goToHistoryIndex(i);
                      setOpenPanel(null);
                    }}
                  />
                </div>
              )}

              {openPanel === "playlist" && (
                <div className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-lg border border-night-line bg-night-panel shadow-lg">
                  <div className="flex items-center justify-between border-b border-night-line px-4 py-2">
                    <span className="lb-eyebrow">Playlists</span>
                    <button
                      type="button"
                      aria-label="Close playlists"
                      onClick={() => setOpenPanel(null)}
                      className="text-mist hover:text-cream"
                    >
                      ✕
                    </button>
                  </div>
                  <PlaylistSelector
                    selectedMood={selectedMood}
                    onSelect={(key) => {
                      selectMood(key);
                      setOpenPanel(null);
                    }}
                  />
                </div>
              )}

              {openPanel === "search" && (
                <div className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-lg border border-night-line bg-night-panel shadow-lg">
                  <div className="flex items-center justify-between border-b border-night-line px-4 py-2">
                    <span className="lb-eyebrow">Search</span>
                    <button
                      type="button"
                      aria-label="Close search"
                      onClick={() => setOpenPanel(null)}
                      className="text-mist hover:text-cream"
                    >
                      ✕
                    </button>
                  </div>
                  <MusicSearch
                    onPlaySong={(song) => {
                      playSongNow(song);
                      setOpenPanel(null);
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <NowPlaying song={currentSong} />

                <div className="flex flex-1 flex-col items-center gap-1">
                  <PlayerControls isPlaying={isPlaying} onTogglePlay={togglePlay} onNext={next} onPrev={prev} />
                  <ProgressBar progress={progress} duration={duration} onSeek={seekTo} />
                </div>

                <div className="flex items-center justify-center gap-1 sm:justify-end">
                  <button
                    type="button"
                    aria-label="Search songs"
                    aria-expanded={openPanel === "search"}
                    onClick={() => togglePanel("search")}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                      openPanel === "search" ? "text-amber" : "text-cream/60 hover:text-cream/90"
                    }`}
                  >
                    <span aria-hidden="true">🔍</span>
                  </button>

                  <button
                    type="button"
                    aria-expanded={openPanel === "playlist"}
                    onClick={() => togglePanel("playlist")}
                    className={`lb-dash-badge max-w-[9rem] transition-colors ${
                      openPanel === "playlist" ? "border-amber/50 text-amber" : ""
                    }`}
                  >
                    <span aria-hidden="true">{activeConfig.emoji}</span>
                    <span className="truncate">{activeConfig.title}</span>
                  </button>

                  <RadioModeToggle isRadioMode={isRadioMode} onToggle={toggleRadioMode} />
                  <ShuffleButton isShuffled={isShuffled} onToggle={toggleShuffle} />
                  <RepeatButton repeatMode={repeatMode} onCycle={setRepeatMode} />
                  <button
                    type="button"
                    aria-label="Recently played"
                    aria-expanded={openPanel === "queue"}
                    onClick={() => togglePanel("queue")}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                      openPanel === "queue" ? "text-amber" : "text-cream/60 hover:text-cream/90"
                    }`}
                  >
                    <span aria-hidden="true">🕘</span>
                  </button>
                  <VolumeControl
                    volume={volume}
                    isMuted={isMuted}
                    onVolumeChange={setVolume}
                    onToggleMute={toggleMute}
                  />
                </div>
              </div>

              <SongAttribution song={currentSong} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
