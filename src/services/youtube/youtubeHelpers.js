// Video ID extraction and IFrame Player error-code mapping. No network calls
// live here — this is pure data-shaping, shared by youtubeApi.js and
// youtubePlayer.js.

/**
 * Extracts an 11-character YouTube video ID from a full URL, a short
 * youtu.be link, or a bare ID that was already passed in.
 */
export function extractVideoId(input) {
  if (!input) return null;
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1).split("/")[0] || null;
    }
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      // /embed/VIDEO_ID or /shorts/VIDEO_ID
      const match = url.pathname.match(/\/(embed|shorts)\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[2];
    }
  } catch {
    // not a valid URL — fall through
  }
  return null;
}

// IFrame Player API error codes: https://developers.google.com/youtube/iframe_api_reference#onError
const PLAYER_ERROR_MESSAGES = {
  2: { code: "invalid_param", message: "Invalid video reference.", skip: true },
  5: { code: "html5_error", message: "Playback error in this browser.", skip: true },
  100: { code: "not_found", message: "This video was removed or made private.", skip: true },
  101: { code: "not_embeddable", message: "This video can't be played here.", skip: true },
  150: { code: "not_embeddable", message: "This video can't be played here.", skip: true },
};

export function mapPlayerError(errorCode) {
  return (
    PLAYER_ERROR_MESSAGES[errorCode] || {
      code: "unknown",
      message: "Playback error.",
      skip: true,
    }
  );
}

// Data API v3 error shapes we specifically care about (search quota/auth).
export function mapDiscoveryError(status, body) {
  const reason = body?.error?.errors?.[0]?.reason;
  if (status === 403 && reason === "quotaExceeded") {
    return { code: "quota_exceeded", message: "Discovery is paused for now (daily limit reached)." };
  }
  if (status === 400 || status === 403) {
    return { code: "invalid_key", message: "Search is unavailable right now." };
  }
  return { code: "network", message: "Couldn't reach YouTube. Check your connection." };
}
