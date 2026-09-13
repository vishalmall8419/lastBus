/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // LAST BUS design tokens — late-night Indian highway, not a generic dark theme.
        night: {
          DEFAULT: "#0B0E14", // deep indigo-black, the night sky through a bus window
          panel: "#12161F", // slightly raised surface (cards, player shell)
          line: "#1C212C", // hairline dividers on dark surfaces
        },
        amber: {
          DEFAULT: "#E8954C", // sodium-vapor highway lamp / headlight glow — primary accent
          soft: "#F2B57A",
          dim: "#8A5A2E",
        },
        rexine: {
          DEFAULT: "#9B3A34", // worn bus-seat rexine red — secondary accent, used sparingly
          soft: "#C05650",
        },
        mist: {
          DEFAULT: "#8A93A6", // fog / muted secondary text
          soft: "#B4BBC9",
        },
        cream: {
          DEFAULT: "#F4EEE2", // warm off-white, like hand-painted bus signage
        },
      },
      fontFamily: {
        display: ["'Yatra One'", "serif"], // wordmark + slide titles only, used with restraint
        body: ["'Manrope'", "system-ui", "sans-serif"], // UI text, controls, labels
        mono: ["'IBM Plex Mono'", "monospace"], // journey clock, route numbers, timestamps
      },
      letterSpacing: {
        widest2: "0.35em",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.85" },
          "94%": { opacity: "1" },
        },
      },
      animation: {
        marquee: "marquee 22s linear infinite",
        flicker: "flicker 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
