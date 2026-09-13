import { useCallback, useEffect, useRef } from "react";
import { searchVideos } from "../services/youtube/youtubeApi";

const REFRESH_EVERY_N_SONGS = 4; // don't call search.list on every single song
const LOW_POOL_THRESHOLD = 6;

/**
 * Owns the decision of *when* Radio Mode should fetch more candidates, and
 * *how* (continue paginating the current query with nextPageToken, or
 * rotate to the next query in the current mood's list once that one's
 * exhausted) — kept separate from MusicProvider so the quota-conscious
 * logic is in one obviously-named place. MusicProvider only calls
 * `shouldTopUp` / `fetchTopUp` and merges whatever comes back into its pool.
 *
 * `moodKey` + `queries` come from the selected playlist (see
 * data/playlistConfigs.js). Switching moods resets the rotation state
 * (query index, pagination token, song counter) so a new mood always starts
 * from its own first query rather than continuing mid-rotation through the
 * previous mood's list.
 */
export default function useRadioMode(moodKey, queries) {
  const songsSincePlayed = useRef(0);
  const queriesRef = useRef(queries);
  const queryIndex = useRef(0);
  const pageToken = useRef(null);
  const lastMoodKey = useRef(moodKey);

  useEffect(() => {
    queriesRef.current = queries;
    if (lastMoodKey.current !== moodKey) {
      lastMoodKey.current = moodKey;
      queryIndex.current = 0;
      pageToken.current = null;
      songsSincePlayed.current = 0;
    }
  }, [moodKey, queries]);

  const registerSongPlayed = useCallback(() => {
    songsSincePlayed.current += 1;
  }, []);

  const shouldTopUp = useCallback((poolSize) => {
    return poolSize <= LOW_POOL_THRESHOLD || songsSincePlayed.current >= REFRESH_EVERY_N_SONGS;
  }, []);

  const fetchTopUp = useCallback(async () => {
    songsSincePlayed.current = 0;
    const list = queriesRef.current;
    try {
      if (pageToken.current) {
        const result = await searchVideos(list[queryIndex.current], {
          pageToken: pageToken.current,
          maxResults: 25,
        });
        pageToken.current = result.nextPageToken;
        return result;
      }
      queryIndex.current = (queryIndex.current + 1) % list.length;
      const result = await searchVideos(list[queryIndex.current], { maxResults: 25 });
      pageToken.current = result.nextPageToken;
      return result;
    } catch {
      // Discovery pausing on failure is fine — playback continues on the
      // existing pool. See mapDiscoveryError for the actual error surfaced
      // to the initial search in MusicProvider.
      return { items: [], nextPageToken: null };
    }
  }, []);

  return { registerSongPlayed, shouldTopUp, fetchTopUp };
}
