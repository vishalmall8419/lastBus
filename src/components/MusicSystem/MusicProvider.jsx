import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import MusicContext from "../../context/MusicContext";
import YouTubePlayer from "./YouTubePlayer";

import { searchVideos } from "../../services/youtube/youtubeApi";
import { mapPlayerError } from "../../services/youtube/youtubeHelpers";

import useSmartShuffle from "../../hooks/useSmartShuffle";
import useRadioMode from "../../hooks/useRadioMode";

import playlistConfigs from "../../data/playlistConfigs";

import {
  readJSON,
  writeJSON,
  LOCAL_KEYS,
  SESSION_KEYS,
} from "../../utils/storage";

const DEFAULT_MOOD = "busRadio";

/* --------------------------------------------------
   Initial State
-------------------------------------------------- */

const initialState = {
  pool: [],
  history: [],
  historyIndex: -1,

  currentSong: null,

  isPlaying: false,
  playerStatus: "idle",
  errorMessage: null,

  volume: 70,
  isMuted: false,

  progress: 0,
  duration: 0,

  repeatMode: "off",

  isRadioMode: true,
  isShuffled: true,

  selectedMood: DEFAULT_MOOD,

  rainEnabled: true,
};

/* --------------------------------------------------
   Reducer
-------------------------------------------------- */

function reducer(state, action) {
  switch (action.type) {
    /* ---------------------------------------------
       Initial Pool
    --------------------------------------------- */

    case "SET_INITIAL_POOL": {
      const pool = Array.isArray(action.payload)
        ? action.payload
        : [];

      if (!pool.length) {
        return {
          ...state,

          pool: [],
          history: [],
          historyIndex: -1,
          currentSong: null,

          isPlaying: false,

          playerStatus: "error",

          errorMessage:
            "No songs found right now.",

          progress: 0,
          duration: 0,
        };
      }

      const first = pool[0];

      return {
        ...state,

        pool,

        history: [first],
        historyIndex: 0,

        currentSong: first,

        /*
          IMPORTANT:
          Song is loaded/cued but NOT playing yet.
        */
        isPlaying: false,

        playerStatus: "ready",

        errorMessage: null,

        progress: 0,
        duration: 0,
      };
    }

    /* ---------------------------------------------
       Append Pool
    --------------------------------------------- */

    case "APPEND_POOL": {
      const existingIds = new Set(
        state.pool.map(
          (song) => song.videoId
        )
      );

      const additions = (
        action.payload || []
      ).filter(
        (song) =>
          song?.videoId &&
          !existingIds.has(song.videoId)
      );

      return {
        ...state,

        pool: [
          ...state.pool,
          ...additions,
        ],
      };
    }

    /* ---------------------------------------------
       Go To New Song
    --------------------------------------------- */

    case "GO_TO_NEW_SONG": {
      const song = action.payload;

      if (!song?.videoId) {
        return state;
      }

      const history = [
        ...state.history,
        song,
      ];

      return {
        ...state,

        history,

        historyIndex:
          history.length - 1,

        currentSong: song,

        isPlaying: false,

        playerStatus: "ready",

        errorMessage: null,

        progress: 0,
        duration: 0,
      };
    }

    /* ---------------------------------------------
       Step Through History
    --------------------------------------------- */

    case "STEP_HISTORY": {
      const historyIndex =
        action.payload;

      const song =
        state.history[historyIndex];

      if (!song?.videoId) {
        return state;
      }

      return {
        ...state,

        historyIndex,

        currentSong: song,

        isPlaying: false,

        playerStatus: "ready",

        errorMessage: null,

        progress: 0,
        duration: 0,
      };
    }

    /* ---------------------------------------------
       Playing State
    --------------------------------------------- */

    case "SET_PLAYING":
      return {
        ...state,

        isPlaying: action.payload,

        playerStatus:
          action.payload
            ? "playing"
            : "paused",
      };

    /* ---------------------------------------------
       Player Status
    --------------------------------------------- */

    case "SET_PLAYER_STATUS":
      return {
        ...state,

        playerStatus:
          action.payload,
      };

    /* ---------------------------------------------
       Error
    --------------------------------------------- */

    case "SET_ERROR":
      return {
        ...state,

        errorMessage:
          action.payload,

        playerStatus:
          action.payload
            ? "error"
            : state.playerStatus,
      };

    /* ---------------------------------------------
       Volume
    --------------------------------------------- */

    case "SET_VOLUME":
      return {
        ...state,

        volume: action.payload,
      };

    /* ---------------------------------------------
       Mute
    --------------------------------------------- */

    case "SET_MUTED":
      return {
        ...state,

        isMuted: action.payload,
      };

    /* ---------------------------------------------
       Progress
    --------------------------------------------- */

    case "SET_PROGRESS":
      return {
        ...state,

        progress:
          action.payload
            ?.currentTime ?? 0,

        duration:
          action.payload
            ?.duration ?? 0,
      };

    /* ---------------------------------------------
       Repeat
    --------------------------------------------- */

    case "SET_REPEAT_MODE":
      return {
        ...state,

        repeatMode:
          action.payload,
      };

    /* ---------------------------------------------
       Shuffle
    --------------------------------------------- */

    case "TOGGLE_SHUFFLE":
      return {
        ...state,

        isShuffled:
          !state.isShuffled,
      };

    /* ---------------------------------------------
       Radio Mode
    --------------------------------------------- */

    case "TOGGLE_RADIO_MODE":
      return {
        ...state,

        isRadioMode:
          !state.isRadioMode,
      };

    /* ---------------------------------------------
       Rain
    --------------------------------------------- */

    case "TOGGLE_RAIN_ENABLED":
      return {
        ...state,

        rainEnabled:
          !state.rainEnabled,
      };

    /* ---------------------------------------------
       Switch Mood
    --------------------------------------------- */

    case "SWITCH_MOOD":
      return {
        ...state,

        selectedMood:
          action.payload,

        pool: [],

        history: [],

        historyIndex: -1,

        currentSong: null,

        isPlaying: false,

        playerStatus: "loading",

        errorMessage: null,

        progress: 0,

        duration: 0,
      };

    /* ---------------------------------------------
       Passive Mood Selection
    --------------------------------------------- */

    case "SET_SELECTED_MOOD_ONLY":
      return {
        ...state,

        selectedMood:
          action.payload,
      };

    /* ---------------------------------------------
       Play Specific Song
    --------------------------------------------- */

    case "PLAY_SPECIFIC_SONG": {
      const song = action.payload;

      if (!song?.videoId) {
        return state;
      }

      const alreadyInPool =
        state.pool.some(
          (item) =>
            item.videoId ===
            song.videoId
        );

      const pool = alreadyInPool
        ? state.pool
        : [
            ...state.pool,
            song,
          ];

      const history = [
        ...state.history,
        song,
      ];

      return {
        ...state,

        pool,

        history,

        historyIndex:
          history.length - 1,

        currentSong: song,

        isPlaying: false,

        playerStatus: "ready",

        errorMessage: null,

        progress: 0,

        duration: 0,
      };
    }

    default:
      return state;
  }
}

/* --------------------------------------------------
   Sequential Playback
-------------------------------------------------- */

function sequentialNext(
  pool,
  currentSong,
  repeatMode
) {
  if (!pool.length) {
    return null;
  }

  const index =
    pool.findIndex(
      (song) =>
        song.videoId ===
        currentSong?.videoId
    );

  const proposed =
    index + 1;

  if (
    proposed >=
    pool.length
  ) {
    return repeatMode ===
      "off"
      ? null
      : pool[0];
  }

  return pool[proposed];
}

/* --------------------------------------------------
   Initial State Builder
-------------------------------------------------- */

function buildInitialState() {
  return {
    ...initialState,

    volume:
      readJSON(
        LOCAL_KEYS.VOLUME
      ) ??
      initialState.volume,

    isMuted:
      readJSON(
        LOCAL_KEYS.IS_MUTED
      ) ??
      initialState.isMuted,

    selectedMood:
      readJSON(
        LOCAL_KEYS.SELECTED_MOOD
      ) ??
      initialState.selectedMood,

    isShuffled:
      readJSON(
        LOCAL_KEYS.IS_SHUFFLED
      ) ??
      initialState.isShuffled,

    repeatMode:
      readJSON(
        LOCAL_KEYS.REPEAT_MODE
      ) ??
      initialState.repeatMode,

    isRadioMode:
      readJSON(
        LOCAL_KEYS.IS_RADIO_MODE
      ) ??
      initialState.isRadioMode,

    rainEnabled:
      readJSON(
        LOCAL_KEYS.RAIN_ENABLED
      ) ??
      initialState.rainEnabled,
  };
}

/* ==================================================
   MUSIC PROVIDER
================================================== */

export default function MusicProvider({
  children,
}) {
  const [state, dispatch] =
    useReducer(
      reducer,
      undefined,
      buildInitialState
    );

  const [hasStarted, setHasStarted] =
    useState(false);

  const [playerReady, setPlayerReady] =
    useState(false);

  const playerRef =
    useRef(null);

  const hasUnlockedAudioRef =
    useRef(false);

  const smartShuffle =
    useSmartShuffle();

  const activeConfig =
    playlistConfigs[
      state.selectedMood
    ] ||
    playlistConfigs[
      DEFAULT_MOOD
    ];

  const radioMode =
    useRadioMode(
      state.selectedMood,
      activeConfig.queries
    );

  /* --------------------------------------------------
     Load Current Song
     
     IMPORTANT:
     We DO NOT automatically call play().
     We only load/cue the video.
  -------------------------------------------------- */

  useEffect(() => {
    const videoId =
      state.currentSong?.videoId;

    if (
      !playerReady ||
      !videoId ||
      !playerRef.current
    ) {
      return;
    }

    /*
      Make sure video ID is valid.
    */

    if (
      typeof videoId !== "string" ||
      videoId.trim().length !== 11
    ) {
      dispatch({
        type: "SET_ERROR",
        payload:
          "Invalid YouTube video ID.",
      });

      return;
    }

    /*
      Reset UI state while new
      video is being prepared.
    */

    dispatch({
      type: "SET_PLAYING",
      payload: false,
    });

    dispatch({
      type: "SET_PLAYER_STATUS",
      payload: "loading",
    });

    /*
      IMPORTANT:

      cue() loads the video without
      automatically starting playback.

      Your YouTubePlayer wrapper must
      expose cueVideoById().
    */

    if (
      typeof playerRef.current
        .cueVideoById ===
      "function"
    ) {
      playerRef.current.cueVideoById(
        videoId
      );
    } else {
      /*
        Fallback for the current wrapper.

        loadVideoById() may start playback,
        but the state will only become
        "playing" after YouTube sends
        the real PLAYING event.
      */

      playerRef.current.loadVideoById(
        videoId
      );
    }

    smartShuffle.remember(
      videoId
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    playerReady,
    state.currentSong?.videoId,
  ]);

  /* --------------------------------------------------
     Volume
  -------------------------------------------------- */

  useEffect(() => {
    if (!playerRef.current) {
      return;
    }

    playerRef.current.setVolume(
      state.volume
    );
  }, [
    state.volume,
  ]);

  /* --------------------------------------------------
     Mute
  -------------------------------------------------- */

  useEffect(() => {
    if (!playerRef.current) {
      return;
    }

    if (state.isMuted) {
      playerRef.current.mute();
    } else {
      playerRef.current.unMute();
    }
  }, [
    state.isMuted,
  ]);

  /* --------------------------------------------------
     Smart Shuffle Hydration
  -------------------------------------------------- */

  useEffect(() => {
    const persistedRecent =
      readJSON(
        LOCAL_KEYS.RECENTLY_PLAYED_IDS
      );

    if (
      persistedRecent
    ) {
      smartShuffle.hydrate(
        persistedRecent
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------
     LocalStorage - Volume
  -------------------------------------------------- */

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.VOLUME,
      state.volume
    );
  }, [
    state.volume,
  ]);

  /* --------------------------------------------------
     LocalStorage - Mute
  -------------------------------------------------- */

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.IS_MUTED,
      state.isMuted
    );
  }, [
    state.isMuted,
  ]);

  /* --------------------------------------------------
     LocalStorage - Mood
  -------------------------------------------------- */

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.SELECTED_MOOD,
      state.selectedMood
    );
  }, [
    state.selectedMood,
  ]);

  /* --------------------------------------------------
     LocalStorage - Shuffle
  -------------------------------------------------- */

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.IS_SHUFFLED,
      state.isShuffled
    );
  }, [
    state.isShuffled,
  ]);

  /* --------------------------------------------------
     LocalStorage - Repeat
  -------------------------------------------------- */

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.REPEAT_MODE,
      state.repeatMode
    );
  }, [
    state.repeatMode,
  ]);

  /* --------------------------------------------------
     LocalStorage - Radio
  -------------------------------------------------- */

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.IS_RADIO_MODE,
      state.isRadioMode
    );
  }, [
    state.isRadioMode,
  ]);

  /* --------------------------------------------------
     LocalStorage - Rain
  -------------------------------------------------- */

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.RAIN_ENABLED,
      state.rainEnabled
    );
  }, [
    state.rainEnabled,
  ]);

  /* --------------------------------------------------
     Recently Played
  -------------------------------------------------- */

  useEffect(() => {
    if (!state.history.length) {
      return;
    }

    const ids =
      state.history
        .slice(-30)
        .map(
          (song) =>
            song.videoId
        )
        .filter(Boolean);

    writeJSON(
      LOCAL_KEYS.RECENTLY_PLAYED_IDS,
      ids
    );
  }, [
    state.history,
  ]);

  /* --------------------------------------------------
     Session Mood
  -------------------------------------------------- */

  useEffect(() => {
    writeJSON(
      SESSION_KEYS.CURRENT_MOOD,
      state.selectedMood,
      "session"
    );
  }, [
    state.selectedMood,
  ]);

  /* --------------------------------------------------
     Session Queue
  -------------------------------------------------- */

  useEffect(() => {
    const ids =
      state.history
        .map(
          (song) =>
            song.videoId
        )
        .filter(Boolean);

    writeJSON(
      SESSION_KEYS.SESSION_QUEUE,
      ids,
      "session"
    );
  }, [
    state.history,
  ]);

  /* --------------------------------------------------
     Journey Started Timestamp
  -------------------------------------------------- */

  const journeyStartedRef =
    useRef(false);

  useEffect(() => {
    if (
      !journeyStartedRef.current &&
      state.playerStatus !==
        "idle"
    ) {
      journeyStartedRef.current =
        true;

      writeJSON(
        SESSION_KEYS.JOURNEY_STARTED_AT,
        new Date().toISOString(),
        "session"
      );
    }
  }, [
    state.playerStatus,
  ]);

  /* --------------------------------------------------
     Radio Mode Top Up
  -------------------------------------------------- */

  const maybeTopUpPool =
    useCallback(
      async () => {
        if (
          !state.isRadioMode
        ) {
          return;
        }

        radioMode.registerSongPlayed();

        if (
          !radioMode.shouldTopUp(
            state.pool.length
          )
        ) {
          return;
        }

        try {
          const { items } =
            await radioMode.fetchTopUp();

          if (
            items?.length
          ) {
            dispatch({
              type:
                "APPEND_POOL",
              payload: items,
            });
          }
        } catch (error) {
          console.error(
            "Radio top-up failed:",
            error
          );
        }
      },

      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        state.isRadioMode,
        state.pool.length,
      ]
    );

  /* --------------------------------------------------
     Next Song
  -------------------------------------------------- */

  const advanceForward =
    useCallback(
      () => {
        /*
          If user previously pressed
          Previous, move forward through
          existing history.
        */

        if (
          state.historyIndex <
          state.history.length - 1
        ) {
          dispatch({
            type:
              "STEP_HISTORY",

            payload:
              state.historyIndex +
              1,
          });

          return;
        }

        const nextSong =
          state.isShuffled
            ? smartShuffle.pickNext(
                state.pool,
                state.currentSong
                  ?.videoId
              )
            : sequentialNext(
                state.pool,
                state.currentSong,
                state.repeatMode
              );

        if (
          !nextSong?.videoId
        ) {
          dispatch({
            type:
              "SET_ERROR",

            payload:
              "That's the whole set for now.",
          });

          return;
        }

        dispatch({
          type:
            "GO_TO_NEW_SONG",

          payload:
            nextSong,
        });

        maybeTopUpPool();
      },

      [
        state.historyIndex,
        state.history,
        state.isShuffled,
        state.pool,
        state.currentSong,
        state.repeatMode,
        smartShuffle.pickNext,
        maybeTopUpPool,
      ]
    );

  /* --------------------------------------------------
     Previous
  -------------------------------------------------- */

  const prev =
    useCallback(
      () => {
        if (
          state.historyIndex >
          0
        ) {
          dispatch({
            type:
              "STEP_HISTORY",

            payload:
              state.historyIndex -
              1,
          });
        }
      },

      [
        state.historyIndex,
      ]
    );

  /* --------------------------------------------------
     Go To History
  -------------------------------------------------- */

  const goToHistoryIndex =
    useCallback(
      (index) => {
        if (
          index >= 0 &&
          index <
            state.history.length
        ) {
          dispatch({
            type:
              "STEP_HISTORY",

            payload: index,
          });
        }
      },

      [
        state.history.length,
      ]
    );

  /* --------------------------------------------------
     Replay Current Song
  -------------------------------------------------- */

  const replayCurrent =
    useCallback(
      () => {
        if (
          !playerRef.current
        ) {
          return;
        }

        playerRef.current.seekTo(
          0,
          true
        );

        playerRef.current.play();

        /*
          Don't optimistically update
          isPlaying.

          handleStateChange()
          will update it when YouTube
          confirms PLAYING.
        */
      },

      []
    );

  /* --------------------------------------------------
     Start Journey
  -------------------------------------------------- */

  const startJourney =
    useCallback(
      async () => {
        setHasStarted(true);

        /*
          If a song already exists,
          play it from the user gesture.
        */

        if (
          state.currentSong?.videoId
        ) {
          if (
            playerRef.current
          ) {
            playerRef.current.play();
          }

          return;
        }

        /*
          No song available.
          Search YouTube.
        */

        dispatch({
          type:
            "SET_PLAYER_STATUS",

          payload:
            "loading",
        });

        try {
          const { items } =
            await searchVideos(
              activeConfig
                .queries[0],
              {
                maxResults: 25,
              }
            );

          /*
            Keep only valid YouTube
            video IDs.
          */

          const validItems =
            (items || []).filter(
              (song) =>
                song?.videoId &&
                typeof song.videoId ===
                  "string" &&
                song.videoId.trim()
                  .length === 11
            );

          dispatch({
            type:
              "SET_INITIAL_POOL",

            payload:
              validItems,
          });

          /*
            IMPORTANT:
            We DON'T call play() here.

            Search is asynchronous, so by
            the time results arrive the
            original click gesture is gone.

            User will click Play after the
            song is loaded.
          */
        } catch (error) {
          dispatch({
            type:
              "SET_ERROR",

            payload:
              error?.message ||
              "Couldn't start the radio right now.",
          });
        }
      },

      [
        state.currentSong?.videoId,
        activeConfig,
      ]
    );

  /* --------------------------------------------------
     Toggle Play / Pause
  -------------------------------------------------- */

  const togglePlay =
    useCallback(
      () => {
        /*
          No current song:
          start journey.
        */

        if (
          !state.currentSong?.videoId
        ) {
          startJourney();

          return;
        }

        /*
          Player isn't ready yet.
        */

        if (
          !playerReady ||
          !playerRef.current
        ) {
          return;
        }

        /*
          PAUSE
        */

        if (
          state.isPlaying
        ) {
          playerRef.current.pause();

          /*
            UI will also receive the
            actual PAUSED event.
          */

          return;
        }

        /*
          PLAY

          This function is triggered by
          the user's actual button click.
        */

        playerRef.current.play();

        /*
          IMPORTANT:
          Do NOT dispatch SET_PLAYING true
          here.

          YouTube will send:
          event.data === 1

          and handleStateChange()
          will update the UI.
        */
      },

      [
        state.currentSong?.videoId,
        state.isPlaying,
        playerReady,
        startJourney,
      ]
    );

  /* --------------------------------------------------
     Volume
  -------------------------------------------------- */

  const setVolume =
    useCallback(
      (value) => {
        const numericValue =
          Number(value);

        if (
          Number.isNaN(
            numericValue
          )
        ) {
          return;
        }

        const safeValue =
          Math.min(
            100,
            Math.max(
              0,
              numericValue
            )
          );

        dispatch({
          type:
            "SET_VOLUME",

          payload:
            safeValue,
        });
      },

      []
    );

  /* --------------------------------------------------
     Toggle Mute
  -------------------------------------------------- */

  const toggleMute =
    useCallback(
      () => {
        dispatch({
          type:
            "SET_MUTED",

          payload:
            !state.isMuted,
        });
      },

      [
        state.isMuted,
      ]
    );

  /* --------------------------------------------------
     Repeat Mode
  -------------------------------------------------- */

  const setRepeatMode =
    useCallback(
      (mode) => {
        dispatch({
          type:
            "SET_REPEAT_MODE",

          payload: mode,
        });
      },

      []
    );

  /* --------------------------------------------------
     Shuffle
  -------------------------------------------------- */

  const toggleShuffle =
    useCallback(
      () => {
        dispatch({
          type:
            "TOGGLE_SHUFFLE",
        });
      },

      []
    );

  /* --------------------------------------------------
     Radio Mode
  -------------------------------------------------- */

  const toggleRadioMode =
    useCallback(
      () => {
        dispatch({
          type:
            "TOGGLE_RADIO_MODE",
        });
      },

      []
    );

  /* --------------------------------------------------
     Rain
  -------------------------------------------------- */

  const toggleRainEnabled =
    useCallback(
      () => {
        dispatch({
          type:
            "TOGGLE_RAIN_ENABLED",
        });
      },

      []
    );

  /* --------------------------------------------------
     Select Mood
  -------------------------------------------------- */

  const selectMood =
    useCallback(
      async (moodKey) => {
        const config =
          playlistConfigs[
            moodKey
          ];

        if (!config) {
          return;
        }

        setHasStarted(true);

        /*
          Reset player readiness.
        */

        setPlayerReady(false);

        dispatch({
          type:
            "SWITCH_MOOD",

          payload:
            moodKey,
        });

        try {
          const { items } =
            await searchVideos(
              config.queries[0],
              {
                maxResults: 25,
              }
            );

          const validItems =
            (items || []).filter(
              (song) =>
                song?.videoId &&
                typeof song.videoId ===
                  "string" &&
                song.videoId.trim()
                  .length === 11
            );

          dispatch({
            type:
              "SET_INITIAL_POOL",

            payload:
              validItems,
          });
        } catch (error) {
          dispatch({
            type:
              "SET_ERROR",

            payload:
              error?.message ||
              "Couldn't switch playlists right now.",
          });
        }
      },

      []
    );

  /* --------------------------------------------------
     Preset Mood
  -------------------------------------------------- */

  const presetMood =
    useCallback(
      (moodKey) => {
        if (
          !playlistConfigs[
            moodKey
          ]
        ) {
          return;
        }

        dispatch({
          type:
            "SET_SELECTED_MOOD_ONLY",

          payload:
            moodKey,
        });
      },

      []
    );

  /* --------------------------------------------------
     Play Specific Song
  -------------------------------------------------- */

  const playSongNow =
    useCallback(
      (song) => {
        if (
          !song?.videoId
        ) {
          return;
        }

        setHasStarted(true);

        dispatch({
          type:
            "PLAY_SPECIFIC_SONG",

          payload:
            song,
        });

        /*
          Actual playback happens only
          after the YouTube player receives
          the song and user presses Play.
        */
      },

      []
    );

  /* --------------------------------------------------
     Seek
  -------------------------------------------------- */

  const seekTo =
    useCallback(
      (seconds) => {
        const value =
          Number(seconds);

        if (
          Number.isNaN(value)
        ) {
          return;
        }

        playerRef.current?.seekTo(
          value,
          true
        );

        dispatch({
          type:
            "SET_PROGRESS",

          payload: {
            currentTime:
              value,

            duration:
              state.duration,
          },
        });
      },

      [
        state.duration,
      ]
    );

  /* ==================================================
     YouTube State Change
  ================================================== */

  const handleStateChange =
    useCallback(
      (event) => {
        if (!event) {
          return;
        }

        /*
          YouTube PlayerState:

          -1 = unstarted
           0 = ended
           1 = playing
           2 = paused
           3 = buffering
           5 = cued
        */

        /* ---------------------------------------------
           ENDED
        --------------------------------------------- */

        if (
          event.data === 0
        ) {
          if (
            state.repeatMode ===
            "one"
          ) {
            replayCurrent();
          } else {
            advanceForward();
          }

          return;
        }

        /* ---------------------------------------------
           PLAYING
        --------------------------------------------- */

        if (
          event.data === 1
        ) {
          dispatch({
            type:
              "SET_PLAYING",

            payload: true,
          });

          /*
            First confirmed playback.

            Audio can now be unlocked.
          */

          if (
            !hasUnlockedAudioRef.current
          ) {
            hasUnlockedAudioRef.current =
              true;

            if (
              !state.isMuted
            ) {
              playerRef.current?.unMute();
            }
          }

          dispatch({
            type:
              "SET_PLAYER_STATUS",

            payload:
              "playing",
          });

          return;
        }

        /* ---------------------------------------------
           PAUSED
        --------------------------------------------- */

        if (
          event.data === 2
        ) {
          dispatch({
            type:
              "SET_PLAYING",

            payload: false,
          });

          return;
        }

        /* ---------------------------------------------
           BUFFERING
        --------------------------------------------- */

        if (
          event.data === 3
        ) {
          dispatch({
            type:
              "SET_PLAYER_STATUS",

            payload:
              "loading",
          });

          return;
        }

        /* ---------------------------------------------
           CUED
        --------------------------------------------- */

        if (
          event.data === 5
        ) {
          dispatch({
            type:
              "SET_PLAYER_STATUS",

            payload:
              "ready",
          });

          dispatch({
            type:
              "SET_PLAYING",

            payload: false,
          });
        }
      },

      [
        advanceForward,
        replayCurrent,
        state.repeatMode,
        state.isMuted,
      ]
    );

  /* ==================================================
     YouTube Error
  ================================================== */

  const handleError =
    useCallback(
      (event) => {
        if (!event) {
          return;
        }

        const mapped =
          mapPlayerError(
            event.data
          );

        dispatch({
          type:
            "SET_ERROR",

          payload:
            mapped?.message ||
            "Unable to play this song.",
        });

        /*
          Skip broken/private/deleted
          videos automatically.
        */

        if (
          mapped?.skip
        ) {
          advanceForward();
        }
      },

      [
        advanceForward,
      ]
    );

  /* ==================================================
     Context Value
  ================================================== */

  const value = {
    ...state,

    startJourney,

    togglePlay,

    next:
      advanceForward,

    prev,

    goToHistoryIndex,

    setVolume,

    toggleMute,

    setRepeatMode,

    toggleShuffle,

    toggleRadioMode,

    toggleRainEnabled,

    selectMood,

    presetMood,

    playSongNow,

    seekTo,
  };

  /* ==================================================
     Render
  ================================================== */

  return (
    <MusicContext.Provider
      value={value}
    >
      {children}

      {/*
        YouTube player is mounted only after
        journey has started and a valid video
        ID exists.
      */}

      {hasStarted &&
        state.currentSong?.videoId && (
          <YouTubePlayer
            ref={playerRef}

            videoId={
              state.currentSong.videoId
            }

            volume={
              state.volume
            }

            onReady={() => {
              setPlayerReady(true);
            }}

            onStateChange={
              handleStateChange
            }

            onError={
              handleError
            }

            onProgress={
              (progress) => {
                dispatch({
                  type:
                    "SET_PROGRESS",

                  payload:
                    progress,
                });
              }
            }
          />
        )}
    </MusicContext.Provider>
  );
}