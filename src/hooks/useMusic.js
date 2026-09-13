import { useContext } from "react";
import MusicContext from "../context/MusicContext";

export default function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error("useMusic() must be used inside <MusicProvider>.");
  }
  return ctx;
}
