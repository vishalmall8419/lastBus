import { useCallback, useEffect, useRef, useState } from "react";
import { searchVideos } from "../services/youtube/youtubeApi";

const DEBOUNCE_MS = 350;
const PAGE_SIZE = 20;

/**
 * Debounced text search. Only calls the Data API once the person actually
 * stops typing (not per keystroke), cancels a stale in-flight request if a
 * new query arrives before it resolves, dedupes results by videoId across
 * pages (search.list can occasionally repeat an item across page
 * boundaries), and exposes a `loadMore` for simple pagination rather than
 * fetching everything at once.
 */
export default function useSongSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | empty | error
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const seenIds = useRef(new Set());

  const runSearch = useCallback(async (q, pageToken) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);

    try {
      const { items, nextPageToken: newToken } = await searchVideos(q, {
        pageToken,
        maxResults: PAGE_SIZE,
        signal: controller.signal,
      });

      const deduped = items.filter((item) => {
        if (seenIds.current.has(item.videoId)) return false;
        seenIds.current.add(item.videoId);
        return true;
      });

      setResults((prev) => (pageToken ? [...prev, ...deduped] : deduped));
      setNextPageToken(newToken);
      setStatus(!pageToken && deduped.length === 0 ? "empty" : "success");
    } catch (err) {
      if (err.name === "AbortError") return; // superseded by a newer query — not a real error
      setError(err.message || "Search failed.");
      setStatus("error");
    }
  }, []);

  // Debounce on query change; a fresh query always resets pagination/dedupe.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    seenIds.current = new Set();
    setNextPageToken(null);

    const trimmed = query.trim();
    if (!trimmed) {
      abortRef.current?.abort();
      setResults([]);
      setStatus("idle");
      return;
    }

    debounceRef.current = setTimeout(() => runSearch(trimmed, null), DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  // Cancel any in-flight request if the component using this hook unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const loadMore = useCallback(() => {
    if (nextPageToken && status !== "loading") runSearch(query.trim(), nextPageToken);
  }, [nextPageToken, query, runSearch, status]);

  const retry = useCallback(() => {
    if (query.trim()) runSearch(query.trim(), null);
  }, [query, runSearch]);

  return { query, setQuery, results, status, error, loadMore, retry, hasMore: Boolean(nextPageToken) };
}
