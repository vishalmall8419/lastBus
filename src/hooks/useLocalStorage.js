import { useCallback, useState } from "react";
import { readJSON, writeJSON } from "../utils/storage";

/**
 * A useState that mirrors itself to storage. Used for simple, standalone
 * preferences elsewhere in the app; MusicProvider's own persistence (many
 * fields, all tied to one reducer) reads/writes storage.js directly rather
 * than using this hook, since a handful of individual useLocalStorage calls
 * would fight with the reducer being the source of truth.
 */
export default function useLocalStorage(key, defaultValue, kind = "local") {
  const [value, setValue] = useState(() => {
    const stored = readJSON(key, kind);
    return stored !== null ? stored : defaultValue;
  });

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        writeJSON(key, resolved, kind);
        return resolved;
      });
    },
    [key, kind]
  );

  return [value, update];
}
