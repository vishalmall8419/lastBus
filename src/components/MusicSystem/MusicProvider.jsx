import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import MusicContext from "../../context/MusicContext";

import YouTubePlayer from "./YouTubePlayer";

import {
  searchVideos,
} from "../../services/youtube/youtubeApi";

import {
  mapPlayerError,
} from "../../services/youtube/youtubeHelpers";

import useSmartShuffle from "../../hooks/useSmartShuffle";

import useRadioMode from "../../hooks/useRadioMode";

import playlistConfigs from "../../data/playlistConfigs";

import {
  readJSON,
  writeJSON,
  LOCAL_KEYS,
  SESSION_KEYS,
} from "../../utils/storage";

const DEFAULT_MOOD =
  "busRadio";

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

  selectedMood:
    DEFAULT_MOOD,

  rainEnabled: true,
};

/* =========================================================
   REDUCER
========================================================= */

function reducer(
  state,
  action
) {
  switch (action.type) {
    case "SET_INITIAL_POOL": {
      const pool =
        Array.isArray(
          action.payload
        )
          ? action.payload.filter(
              (song) =>
                song?.videoId &&
                typeof song.videoId ===
                  "string" &&
                song.videoId.trim()
                  .length === 11
            )
          : [];

      if (!pool.length) {
        return {
          ...state,

          pool: [],

          history: [],

          historyIndex: -1,

          currentSong: null,

          isPlaying: false,

          playerStatus:
            "error",

          errorMessage:
            "No songs found right now.",

          progress: 0,

          duration: 0,
        };
      }

      const first =
        pool[0];

      return {
        ...state,

        pool,

        history: [first],

        historyIndex: 0,

        currentSong: first,

        isPlaying: false,

        playerStatus:
          "ready",

        errorMessage: null,

        progress: 0,

        duration: 0,
      };
    }

    case "APPEND_POOL": {
      const existingIds =
        new Set(
          state.pool.map(
            (song) =>
              song.videoId
          )
        );

      const additions =
        (
          Array.isArray(
            action.payload
          )
            ? action.payload
            : []
        ).filter(
          (song) =>
            song?.videoId &&
            typeof song.videoId ===
              "string" &&
            song.videoId.trim()
              .length === 11 &&
            !existingIds.has(
              song.videoId
            )
        );

      return {
        ...state,

        pool: [
          ...state.pool,
          ...additions,
        ],
      };
    }

    case "GO_TO_NEW_SONG": {
      const song =
        action.payload;

      if (
        !song?.videoId
      ) {
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

        playerStatus:
          "loading",

        errorMessage: null,

        progress: 0,

        duration: 0,
      };
    }

    case "STEP_HISTORY": {
      const index =
        action.payload;

      const song =
        state.history[index];

      if (
        !song?.videoId
      ) {
        return state;
      }

      return {
        ...state,

        historyIndex: index,

        currentSong: song,

        isPlaying: false,

        playerStatus:
          "loading",

        errorMessage: null,

        progress: 0,

        duration: 0,
      };
    }

    case "PLAY_SPECIFIC_SONG": {
      const song =
        action.payload;

      if (
        !song?.videoId
      ) {
        return state;
      }

      const exists =
        state.pool.some(
          (item) =>
            item.videoId ===
            song.videoId
        );

      const pool = exists
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

        playerStatus:
          "loading",

        errorMessage: null,

        progress: 0,

        duration: 0,
      };
    }

    case "SET_PLAYING":
      return {
        ...state,

        isPlaying:
          Boolean(
            action.payload
          ),

        playerStatus:
          action.payload
            ? "playing"
            : "paused",
      };

    case "SET_PLAYER_STATUS":
      return {
        ...state,

        playerStatus:
          action.payload,
      };

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

    case "SET_VOLUME":
      return {
        ...state,

        volume:
          action.payload,
      };

    case "SET_MUTED":
      return {
        ...state,

        isMuted:
          action.payload,
      };

    case "SET_PROGRESS":
      return {
        ...state,

        progress:
          Number(
            action.payload
              ?.currentTime
          ) || 0,

        duration:
          Number(
            action.payload
              ?.duration
          ) || 0,
      };

    case "SET_REPEAT_MODE":
      return {
        ...state,

        repeatMode:
          action.payload,
      };

    case "TOGGLE_SHUFFLE":
      return {
        ...state,

        isShuffled:
          !state.isShuffled,
      };

    case "TOGGLE_RADIO_MODE":
      return {
        ...state,

        isRadioMode:
          !state.isRadioMode,
      };

    case "TOGGLE_RAIN_ENABLED":
      return {
        ...state,

        rainEnabled:
          !state.rainEnabled,
      };

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

        playerStatus:
          "loading",

        errorMessage: null,

        progress: 0,

        duration: 0,
      };

    case "SET_SELECTED_MOOD_ONLY":
      return {
        ...state,

        selectedMood:
          action.payload,
      };

    default:
      return state;
  }
}

/* =========================================================
   SEQUENTIAL NEXT
========================================================= */

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

  if (index === -1) {
    return pool[0];
  }

  const nextIndex =
    index + 1;

  if (
    nextIndex >=
    pool.length
  ) {
    if (
      repeatMode === "all"
    ) {
      return pool[0];
    }

    return null;
  }

  return pool[nextIndex];
}

/* =========================================================
   INITIAL STATE
========================================================= */

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

/* =========================================================
   MUSIC PROVIDER
========================================================= */

export default function MusicProvider({
  children,
}) {
  const [
    state,
    dispatch,
  ] = useReducer(
    reducer,
    undefined,
    buildInitialState
  );

  const [
    hasStarted,
    setHasStarted,
  ] = useState(false);

  const [
    playerReady,
    setPlayerReady,
  ] = useState(false);

  const playerRef =
    useRef(null);

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

  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.VOLUME,
      state.volume
    );
  }, [state.volume]);

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.IS_MUTED,
      state.isMuted
    );
  }, [state.isMuted]);

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.SELECTED_MOOD,
      state.selectedMood
    );
  }, [state.selectedMood]);

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.IS_SHUFFLED,
      state.isShuffled
    );
  }, [state.isShuffled]);

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.REPEAT_MODE,
      state.repeatMode
    );
  }, [state.repeatMode]);

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.IS_RADIO_MODE,
      state.isRadioMode
    );
  }, [state.isRadioMode]);

  useEffect(() => {
    writeJSON(
      LOCAL_KEYS.RAIN_ENABLED,
      state.rainEnabled
    );
  }, [state.rainEnabled]);

  /* =========================================================
     VOLUME
  ========================================================= */

  useEffect(() => {
    if (
      playerReady &&
      playerRef.current
    ) {
      playerRef.current.setVolume(
        state.volume
      );
    }
  }, [
    state.volume,
    playerReady,
  ]);

  /* =========================================================
     MUTE
  ========================================================= */

  useEffect(() => {
    if (
      !playerReady ||
      !playerRef.current
    ) {
      return;
    }

    if (
      state.isMuted
    ) {
      playerRef.current.mute();
    } else {
      playerRef.current.unMute();
    }
  }, [
    state.isMuted,
    playerReady,
  ]);

  /* =========================================================
     START JOURNEY
  ========================================================= */

  const startJourney =
    useCallback(
      async () => {
        setHasStarted(true);

        /*
        If a song already exists,
        Play button itself is a user gesture.
        */

        if (
          state.currentSong?.videoId &&
          playerReady
        ) {
          playerRef.current?.play();

          return;
        }

        dispatch({
          type:
            "SET_PLAYER_STATUS",

          payload:
            "loading",
        });

        try {
          const {
            items,
          } =
            await searchVideos(
              activeConfig
                .queries[0],
              {
                maxResults: 25,
              }
            );

          dispatch({
            type:
              "SET_INITIAL_POOL",

            payload:
              items,
          });
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
        playerReady,
        activeConfig,
      ]
    );

  /* =========================================================
     PLAY / PAUSE
  ========================================================= */

  const togglePlay =
    useCallback(
      () => {
        /*
        No song.
        */

        if (
          !state.currentSong?.videoId
        ) {
          startJourney();

          return;
        }

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

          return;
        }

        /*
        PLAY

        This happens directly from the user's
        Play button click.
        */

        playerRef.current.play();
      },
      [
        state.currentSong?.videoId,
        state.isPlaying,
        playerReady,
        startJourney,
      ]
    );

  /* =========================================================
     NEXT
  ========================================================= */

  const advanceForward =
    useCallback(
      () => {
        if (
          !state.pool.length
        ) {
          return;
        }

        let nextSong =
          null;

        /*
        ---------------------------------------------------------
        HISTORY FORWARD
        ---------------------------------------------------------
        */

        if (
          state.historyIndex <
          state.history.length - 1
        ) {
          nextSong =
            state.history[
              state.historyIndex + 1
            ];
        }

        /*
        ---------------------------------------------------------
        NEW SONG
        ---------------------------------------------------------
        */

        if (!nextSong) {
          nextSong =
            state.isShuffled
              ? smartShuffle.pickNext(
                  state.pool,
                  state.currentSong?.videoId
                )
              : sequentialNext(
                  state.pool,
                  state.currentSong,
                  state.repeatMode
                );
        }

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

        /*
        =========================================================
        MOST IMPORTANT FIX
        =========================================================

        Next button ka click abhi active hai.

        Isliye loadAndPlay() ko DIRECT yahin call
        kar rahe hain.

        useEffect mein nahi.
        =========================================================
        */

        if (
          playerReady &&
          playerRef.current
        ) {
          playerRef.current.loadAndPlay(
            nextSong.videoId
          );
        }

        /*
        UI state update.
        */

        if (
          state.historyIndex <
          state.history.length - 1
        ) {
          dispatch({
            type:
              "STEP_HISTORY",

            payload:
              state.historyIndex + 1,
          });
        } else {
          dispatch({
            type:
              "GO_TO_NEW_SONG",

            payload:
              nextSong,
          });
        }

        smartShuffle.remember(
          nextSong.videoId
        );

        /*
        Radio pool background top-up.
        */

        if (
          state.isRadioMode
        ) {
          radioMode.registerSongPlayed();

          if (
            radioMode.shouldTopUp(
              state.pool.length
            )
          ) {
            radioMode
              .fetchTopUp()
              .then(
                ({
                  items,
                }) => {
                  if (
                    items?.length
                  ) {
                    dispatch({
                      type:
                        "APPEND_POOL",

                      payload:
                        items,
                    });
                  }
                }
              )
              .catch(
                console.error
              );
          }
        }
      },
      [
        state.pool,
        state.historyIndex,
        state.history,
        state.isShuffled,
        state.currentSong,
        state.repeatMode,
        state.isRadioMode,
        playerReady,
        smartShuffle,
        radioMode,
      ]
    );

  /* =========================================================
     PREVIOUS
  ========================================================= */

  const prev =
    useCallback(
      () => {
        if (
          state.historyIndex <= 0
        ) {
          return;
        }

        const previousSong =
          state.history[
            state.historyIndex - 1
          ];

        if (
          !previousSong?.videoId
        ) {
          return;
        }

        /*
        Direct user click:
        load + play immediately.
        */

        if (
          playerReady &&
          playerRef.current
        ) {
          playerRef.current.loadAndPlay(
            previousSong.videoId
          );
        }

        dispatch({
          type:
            "STEP_HISTORY",

          payload:
            state.historyIndex - 1,
        });
      },
      [
        state.historyIndex,
        state.history,
        playerReady,
      ]
    );

  /* =========================================================
     HISTORY SELECT
  ========================================================= */

  const goToHistoryIndex =
    useCallback(
      (index) => {
        if (
          index < 0 ||
          index >=
            state.history.length
        ) {
          return;
        }

        const song =
          state.history[index];

        if (
          !song?.videoId
        ) {
          return;
        }

        if (
          playerReady &&
          playerRef.current
        ) {
          playerRef.current.loadAndPlay(
            song.videoId
          );
        }

        dispatch({
          type:
            "STEP_HISTORY",

          payload:
            index,
        });
      },
      [
        state.history,
        playerReady,
      ]
    );

  /* =========================================================
     REPLAY
  ========================================================= */

  const replayCurrent =
    useCallback(
      () => {
        if (
          !playerRef.current
        ) {
          return;
        }

        playerRef.current.seekTo(
          0
        );

        playerRef.current.play();
      },
      []
    );

  /* =========================================================
     PLAY SPECIFIC SONG
  ========================================================= */

  const playSongNow =
    useCallback(
      (song) => {
        if (
          !song?.videoId
        ) {
          return;
        }

        setHasStarted(true);

        /*
        Direct user action.
        */

        if (
          playerReady &&
          playerRef.current
        ) {
          playerRef.current.loadAndPlay(
            song.videoId
          );
        }

        dispatch({
          type:
            "PLAY_SPECIFIC_SONG",

          payload:
            song,
        });
      },
      [playerReady]
    );

  /* =========================================================
     SEEK
  ========================================================= */

  const seekTo =
    useCallback(
      (seconds) => {
        const value =
          Number(seconds);

        if (
          !Number.isFinite(value)
        ) {
          return;
        }

        playerRef.current?.seekTo(
          value
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
      [state.duration]
    );

  /* =========================================================
     VOLUME
  ========================================================= */

  const setVolume =
    useCallback(
      (value) => {
        const numeric =
          Number(value);

        if (
          !Number.isFinite(
            numeric
          )
        ) {
          return;
        }

        dispatch({
          type:
            "SET_VOLUME",

          payload:
            Math.min(
              100,
              Math.max(
                0,
                numeric
              )
            ),
        });
      },
      []
    );

  /* =========================================================
     MUTE
  ========================================================= */

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
      [state.isMuted]
    );

  /* =========================================================
     REPEAT
  ========================================================= */

  const setRepeatMode =
    useCallback(
      (mode) => {
        dispatch({
          type:
            "SET_REPEAT_MODE",

          payload:
            mode,
        });
      },
      []
    );

  /* =========================================================
     SHUFFLE
  ========================================================= */

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

  /* =========================================================
     RADIO
  ========================================================= */

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

  /* =========================================================
     RAIN
  ========================================================= */

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

  /* =========================================================
     SELECT MOOD
  ========================================================= */

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
        Stop current song first.
        */

        playerRef.current?.stop();

        dispatch({
          type:
            "SWITCH_MOOD",

          payload:
            moodKey,
        });

        try {
          const {
            items,
          } =
            await searchVideos(
              config.queries[0],
              {
                maxResults: 25,
              }
            );

          dispatch({
            type:
              "SET_INITIAL_POOL",

            payload:
              items,
          });
        } catch (error) {
          dispatch({
            type:
              "SET_ERROR",

            payload:
              error?.message ||
              "Couldn't switch playlist.",
          });
        }
      },
      []
    );

  /* =========================================================
     PRESET MOOD
  ========================================================= */

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

  /* =========================================================
     YOUTUBE STATE CHANGE
  ========================================================= */

  const handleStateChange =
    useCallback(
      (event) => {
        if (!event) {
          return;
        }

        /*
        ---------------------------------------------------------
        ENDED
        ---------------------------------------------------------
        */

        if (
          event.data === 0
        ) {
          if (
            state.repeatMode ===
            "one"
          ) {
            replayCurrent();

            return;
          }

          /*
          Automatic next.
          */

          advanceForward();

          return;
        }

        /*
        ---------------------------------------------------------
        PLAYING
        ---------------------------------------------------------
        */

        if (
          event.data === 1
        ) {
          dispatch({
            type:
              "SET_PLAYING",

            payload:
              true,
          });

          dispatch({
            type:
              "SET_PLAYER_STATUS",

            payload:
              "playing",
          });

          /*
          If user has not muted,
          make sure player is unmuted.
          */

          if (
            !state.isMuted
          ) {
            playerRef.current?.unMute();
          }

          return;
        }

        /*
        ---------------------------------------------------------
        PAUSED
        ---------------------------------------------------------
        */

        if (
          event.data === 2
        ) {
          dispatch({
            type:
              "SET_PLAYING",

            payload:
              false,
          });

          dispatch({
            type:
              "SET_PLAYER_STATUS",

            payload:
              "paused",
          });

          return;
        }

        /*
        ---------------------------------------------------------
        BUFFERING
        ---------------------------------------------------------
        */

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

        /*
        ---------------------------------------------------------
        CUED
        ---------------------------------------------------------
        */

        if (
          event.data === 5
        ) {
          dispatch({
            type:
              "SET_PLAYING",

            payload:
              false,
          });

          dispatch({
            type:
              "SET_PLAYER_STATUS",

            payload:
              "ready",
          });
        }
      },
      [
        state.repeatMode,
        state.isMuted,
        advanceForward,
        replayCurrent,
      ]
    );

  /* =========================================================
     AUTOPLAY BLOCKED
  ========================================================= */

  const handleAutoplayBlocked =
    useCallback(
      () => {
        console.warn(
          "YouTube blocked playback. Press Play to continue."
        );

        dispatch({
          type:
            "SET_PLAYING",

          payload:
            false,
        });

        dispatch({
          type:
            "SET_PLAYER_STATUS",

          payload:
            "paused",
        });
      },
      []
    );

  /* =========================================================
     YOUTUBE ERROR
  ========================================================= */

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

        if (
          mapped?.skip
        ) {
          advanceForward();
        }
      },
      [advanceForward]
    );

  /* =========================================================
     CONTEXT
  ========================================================= */

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

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <MusicContext.Provider
      value={value}
    >
      {children}

      {/*
      Player ko current song ke saath sirf
      FIRST time create karo.

      Uske baad Next/Previous direct player
      methods se video change karega.
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
            onAutoplayBlocked={
              handleAutoplayBlocked
            }
            onProgress={(
              progress
            ) => {
              dispatch({
                type:
                  "SET_PROGRESS",

                payload:
                  progress,
              });
            }}
          />
        )}
    </MusicContext.Provider>
  );
}