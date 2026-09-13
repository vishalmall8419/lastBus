import { useCallback, useEffect, useRef, useState } from "react";
import HeroCarousel from "./components/HeroExperience/HeroCarousel";
import TopNav from "./components/Navigation/TopNav";
import MusicProvider from "./components/MusicSystem/MusicProvider";
import MusicPlayer from "./components/MusicSystem/MusicPlayer";
import MoodSuggestion from "./components/MusicSystem/MoodSuggestion";
import useMusic from "./hooks/useMusic";
import useJourneyClock from "./hooks/useJourneyClock";
import useCurrentTime from "./hooks/useCurrentTime";
import heroSlides from "./data/heroSlides";
import { resolveMoodChange } from "./utils/moodToPlaylistMap";

/**
 * LAST BUS.
 *
 * Journey Clock progression: before "Enter Journey", the displayed time
 * mirrors whichever hero slide is showing (unchanged from earlier phases).
 * Once the journey actually starts, useJourneyClock takes over and the
 * clock advances on its own through a fixed sequence of checkpoints,
 * independent of which hero slide happens to be on screen — a real bus
 * journey's night doesn't reset every time you glance out a different
 * window. Checkpoint changes feed the same suggest-never-auto-switch mood
 * bridge the Hero already uses, via one shared `suggestion` state.
 */
function AppContent() {
  const [activeSlide, setActiveSlide] = useState(heroSlides[0]);
  const [suggestion, setSuggestion] = useState(null); // { playlistKey } | null
  const { startJourney, playerStatus, isPlaying, selectedMood, presetMood, selectMood, rainEnabled } = useMusic();
  const isFirstSlideChange = useRef(true);
  const isFirstClockStep = useRef(true);

  const journeyClock = useJourneyClock(playerStatus !== "idle");
  const currentTime = useCurrentTime();

  // Refs so the clock-progression effect below can read the *latest*
  // isPlaying/selectedMood without needing them in its dependency array —
  // it should only re-evaluate when the clock actually ticks forward, not
  // every time playback state happens to change for an unrelated reason.
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const selectedMoodRef = useRef(selectedMood);
  selectedMoodRef.current = selectedMood;


  const handleSlideChange = useCallback(
    (slide) => {
      setActiveSlide(slide);

      const wasFirst = isFirstSlideChange.current;
      isFirstSlideChange.current = false;

      const resolution = resolveMoodChange(slide.mood, isPlaying);
      if (!resolution || resolution.playlistKey === selectedMood) {
        setSuggestion(null);
        return;
      }

      if (resolution.type === "apply") {
        if (!wasFirst) presetMood(resolution.playlistKey);
        setSuggestion(null);
      } else {
        setSuggestion({ playlistKey: resolution.playlistKey });
      }
    },
    [isPlaying, selectedMood, presetMood]
  );

  // Journey Clock progression -> mood suggestion. Skips its own very first
  // checkpoint (the one active the instant the journey starts) so it never
  // immediately second-guesses the mood the person just deliberately chose
  // to start with — same reasoning as the Hero's isFirstSlideChange guard.
  useEffect(() => {
    if (playerStatus === "idle") return;
    if (isFirstClockStep.current) {
      isFirstClockStep.current = false;
      return;
    }
    const resolution = resolveMoodChange(journeyClock.mood, isPlayingRef.current);
    if (resolution && resolution.playlistKey !== selectedMoodRef.current) {
      setSuggestion({ playlistKey: resolution.playlistKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyClock.mood, playerStatus]);

  return (
    <div className="relative min-h-screen w-full bg-night text-cream">
      <TopNav currentTime={currentTime} isJourneyComplete={journeyClock.isJourneyComplete} />

      <HeroCarousel
        onEnterJourney={startJourney}
        onSlideChange={handleSlideChange}
        playerVisible={playerStatus !== "idle"}
        rainEnabled={rainEnabled}
      />

      {suggestion && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-30 flex justify-center px-4 sm:top-20">
          <MoodSuggestion
            playlistKey={suggestion.playlistKey}
            onSwitch={() => {
              selectMood(suggestion.playlistKey);
              setSuggestion(null);
            }}
            onDismiss={() => setSuggestion(null)}
          />
        </div>
      )}

      <MusicPlayer />

      {/* Signature element: a destination-board style marquee, like the route
          board above an Indian bus windshield. Placeholder copy for now —
          later phases will feed it live journey/route data. */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 overflow-hidden border-t border-night-line bg-night-panel/80 py-2 backdrop-blur-sm"
        role="presentation"
      >
        <div className="animate-marquee motion-reduce:animate-none flex w-max whitespace-nowrap font-mono text-[11px] tracking-widest2 text-amber/70 sm:text-xs">
          <span className="px-6">NH-27 · LAST BUS · TONIGHT ONLY</span>
          <span className="px-6">NH-27 · LAST BUS · TONIGHT ONLY</span>
          <span className="px-6">NH-27 · LAST BUS · TONIGHT ONLY</span>
          <span className="px-6">NH-27 · LAST BUS · TONIGHT ONLY</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MusicProvider>
      <AppContent />
    </MusicProvider>
  );
}
