// YouTube Data API v3 — search/discovery ONLY. This file never touches
// playback; that responsibility lives entirely in youtubePlayer.js.
//
// The API key is a browser-exposed Vite env var, not a secret — see
// .env.example and the README for the Google Cloud Console restrictions
// (HTTP referrer + API restriction) that actually protect it.

import { mapDiscoveryError } from "./youtubeHelpers";
import { getCached, setCached } from "../../utils/cache";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

/**
 * Searches YouTube for videos matching `query`. Returns a small, already-
 * paginated page of results — callers are responsible for not calling this
 * more often than a meaningful user/radio action (see useSmartShuffle /
 * useRadioMode in Phase 5), to stay quota-conscious.
 *
 * Checks a small in-memory cache first (utils/cache.js) — if this exact
 * query+pageToken was already fetched in the last 10 minutes, this returns
 * instantly with zero network/quota cost instead of re-fetching.
 *
 * @param {string} query
 * @param {{ pageToken?: string, maxResults?: number, signal?: AbortSignal }} options
 * @returns {Promise<{ items: Array, nextPageToken: string|null }>}
 */
export async function searchVideos(query, { pageToken, maxResults = 25, signal } = {}) {
  const cached = getCached(query, pageToken);
  if (cached) return cached;

  if (!API_KEY) {
    throw { code: "invalid_key", message: "YouTube API key is not configured." };
  }

  const params = new URLSearchParams({
    key: API_KEY,
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    maxResults: String(maxResults),
    q: query,
  });
  if (pageToken) params.set("pageToken", pageToken);

  let response;
  try {
    response = await fetch(`${BASE_URL}/search?${params.toString()}`, { signal });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw mapDiscoveryError(0, null);
  }

  if (!response.ok) {
    let body = null;
    try {
      body = await response.json();
    } catch {
      // ignore — non-JSON error body
    }
    throw mapDiscoveryError(response.status, body);
  }

  const data = await response.json();

  const items = (data.items || [])
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail:
        item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
    }));

  const result = { items, nextPageToken: data.nextPageToken || null };
  setCached(query, pageToken, result);
  return result;
}
