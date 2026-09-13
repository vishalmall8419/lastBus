// Bridges the Hero Carousel's slide moods to playlist keys, without either
// side needing to know about the other's internals (Hero doesn't know about
// queues; Music doesn't know about slides — see the architecture's
// Hero<->Music Mood Bridge section).

const moodToPlaylistMap = {
  midnight: "midnightJourney",
  rain: "baarishWaliRaat",
  dhaba: "dhabaStop",
  dawn: "subahHoneWaliHai",
};

export default moodToPlaylistMap;

/**
 * IMPORTANT: a hero slide changing must never interrupt a song someone is
 * actively listening to. If nothing is playing yet, it's safe to just apply
 * the mood as the starting playlist. If something IS playing, the mood
 * becomes a suggestion the person can act on — never automatic.
 */
export function resolveMoodChange(slideMood, isPlaying) {
  const playlistKey = moodToPlaylistMap[slideMood];
  if (!playlistKey) return null;
  return { type: isPlaying ? "suggest" : "apply", playlistKey };
}
