// Hero carousel slide data
// New WEBP images are used instead of the old SVG scene files.

import nightJourneyBg from "../assets/images/night-journey-bg.webp";
import rainyNight from "../assets/images/rainy-night.webp";
import nightBusJourney from "../assets/images/night-bus-journey.webp";
import musicHeadphones from "../assets/images/music-headphones.webp";
import audioWave from "../assets/images/audio-wave.webp";

const heroSlides = [
  {
    id: 1,
    image: nightJourneyBg,
    title: "LAST BUS",
    subtitle: "The journey continues...",
    location: "NH-27 • 11:47 PM",
    mood: "midnight",
    kenBurns: "zoom-in",
    desktopPosition: "center center",
    mobilePosition: "center center",
  },

  {
    id: 2,
    image: rainyNight,
    title: "BAARISH WALI RAAT",
    subtitle: "Some journeys sound better in the rain.",
    location: "Highway • 12:18 AM",
    mood: "rain",
    kenBurns: "pan-left",
    desktopPosition: "center center",
    mobilePosition: "60% center",
  },

  {
    id: 3,
    image: nightBusJourney,
    title: "DHABA STOP",
    subtitle: "Ten minutes. Chai, and the radio keeps playing.",
    location: "Highway Dhaba • 1:40 AM",
    mood: "dhaba",
    kenBurns: "zoom-out",
    desktopPosition: "center 40%",
    mobilePosition: "center 30%",
  },

  {
    id: 4,
    image: musicHeadphones,
    title: "WINDOW SEAT",
    subtitle: "Half asleep, half listening to an old song.",
    location: "Seat 14 • 2:55 AM",
    mood: "midnight",
    kenBurns: "pan-right",
    desktopPosition: "center center",
    mobilePosition: "40% center",
  },

  {
    id: 5,
    image: audioWave,
    title: "SUBAH HONE WALI HAI",
    subtitle: "The sky changes before the radio does.",
    location: "NH-27 • 5:30 AM",
    mood: "dawn",
    kenBurns: "pan-up",
    desktopPosition: "center center",
    mobilePosition: "center 60%",
  },
];

export default heroSlides;