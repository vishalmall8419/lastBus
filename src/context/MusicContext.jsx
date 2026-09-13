import { createContext } from "react";

// Populated by MusicProvider. Consumed via the useMusic() hook rather than
// directly, so components never need to import this file themselves.
const MusicContext = createContext(null);

export default MusicContext;
