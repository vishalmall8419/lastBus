// Low-level LocalStorage/SessionStorage read/write helpers. Every call is
// wrapped in try/catch because storage APIs can throw (private/incognito
// mode in some browsers, storage quota exceeded, disabled by the user) —
// none of that should ever break the app, it should just mean preferences
// don't persist. Falls back to an in-memory Map for the current tab so the
// app still behaves consistently within a single session even if storage
// is completely unavailable.

const memoryFallback = new Map();

function getStore(kind) {
  try {
    return kind === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

export function readJSON(key, kind = "local") {
  const store = getStore(kind);
  if (!store) return memoryFallback.has(`${kind}:${key}`) ? memoryFallback.get(`${kind}:${key}`) : null;
  try {
    const raw = store.getItem(key);
    return raw !== null ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key, value, kind = "local") {
  const store = getStore(kind);
  if (!store) {
    memoryFallback.set(`${kind}:${key}`, value);
    return false;
  }
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    memoryFallback.set(`${kind}:${key}`, value);
    return false;
  }
}

export function removeItem(key, kind = "local") {
  const store = getStore(kind);
  try {
    store?.removeItem(key);
  } catch {
    // ignore — nothing meaningful to recover from here
  }
  memoryFallback.delete(`${kind}:${key}`);
}

// Namespaced, capped keys — kept in one place so nothing collides with
// other apps on the same origin and so the caps (e.g. recently-played) are
// visible right next to the key that needs them.
export const LOCAL_KEYS = {
  VOLUME: "lastBus:volume",
  IS_MUTED: "lastBus:isMuted",
  SELECTED_MOOD: "lastBus:lastSelectedMood",
  IS_SHUFFLED: "lastBus:shuffleEnabled",
  REPEAT_MODE: "lastBus:repeatMode",
  IS_RADIO_MODE: "lastBus:radioModeEnabled",
  RAIN_ENABLED: "lastBus:rainEnabled",
  RECENTLY_PLAYED_IDS: "lastBus:recentlyPlayedSongIds", // capped at 30, see MusicProvider
};

export const SESSION_KEYS = {
  CURRENT_MOOD: "lastBus:session:currentMood",
  JOURNEY_STARTED_AT: "lastBus:session:journeyStartedAt",
  SESSION_QUEUE: "lastBus:session:sessionQueue",
};
