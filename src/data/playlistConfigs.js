// Virtual playlists: each is just a name + a handful of search-query
// templates. There's no database here — "adding a playlist" means adding an
// entry to this file, not inserting rows anywhere. `queries` is what
// useRadioMode rotates through as the pool needs topping up (see §4 of the
// architecture doc — "Discovery Strategy: Query Templates, Not a Database").
//
// Every mood is still 90s-first, per the brief's music-priority requirement
// — that's carried entirely by the wording of the queries themselves, since
// YouTube search results don't reliably expose a release year to weight by
// (see the honest limitation noted in utils/shuffle.js).

const playlistConfigs = {
  busRadio: {
    title: "Bus Radio",
    emoji: "📻",
    queries: ["90s Bollywood hits", "90s Hindi nostalgic songs"],
  },
  midnightJourney: {
    title: "Midnight Journey",
    emoji: "🌙",
    queries: ["90s Hindi Bollywood night songs", "90s Bollywood romantic songs"],
  },
  baarishWaliRaat: {
    title: "Baarish Wali Raat",
    emoji: "🌧️",
    queries: ["90s Bollywood rain songs", "90s Hindi monsoon songs"],
  },
  highwayNights: {
    title: "Highway Nights",
    emoji: "🛣️",
    queries: ["90s Bollywood road trip songs", "90s Hindi highway journey songs"],
  },
  ninetiesRomance: {
    title: "90s Romance",
    emoji: "❤️",
    queries: ["90s Bollywood romantic hits", "90s Hindi love songs"],
  },
  sadJourney: {
    title: "Sad Journey",
    emoji: "💔",
    queries: ["90s Hindi sad songs", "90s Bollywood emotional songs"],
  },
  dosti: {
    title: "Dosti",
    emoji: "👬",
    queries: ["90s Bollywood friendship songs"],
  },
  dhabaStop: {
    title: "Dhaba Stop",
    emoji: "☕",
    queries: ["90s Bollywood relaxed songs", "90s Hindi light songs"],
  },
  subahHoneWaliHai: {
    title: "Subah Hone Wali Hai",
    emoji: "🌅",
    queries: ["90s Bollywood morning songs", "90s Hindi soft melodies"],
  },
};

export default playlistConfigs;
