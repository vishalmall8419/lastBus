// A small bounded LRU cache for YouTube Data API search results, keyed by
// query+pageToken. Purpose: if the same query gets requested again within a
// few minutes (re-selecting a playlist you were just on, re-running the
// same text search, useRadioMode's own pagination revisiting something) we
// answer from memory instead of spending API quota on an identical request.
//
// Bounded (MAX_ENTRIES) and time-limited (TTL_MS) on purpose — this is a
// convenience cache, not a source of truth, and it must never grow without
// bound or serve results so stale they feel wrong.

const MAX_ENTRIES = 20;
const TTL_MS = 10 * 60 * 1000; // 10 minutes

const store = new Map(); // insertion order == LRU order (Map preserves this)

function makeKey(query, pageToken) {
  return `${query}::${pageToken || ""}`;
}

export function getCached(query, pageToken) {
  const key = makeKey(query, pageToken);
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() - entry.cachedAt > TTL_MS) {
    store.delete(key);
    return null;
  }

  // Refresh recency: delete + re-set moves this key to the end of Map's
  // iteration order, which is what makes eviction below a real LRU.
  store.delete(key);
  store.set(key, entry);
  return entry.data;
}

export function setCached(query, pageToken, data) {
  const key = makeKey(query, pageToken);
  store.delete(key); // so re-inserting below puts it at the "most recent" end
  store.set(key, { data, cachedAt: Date.now() });

  while (store.size > MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    store.delete(oldestKey);
  }
}
