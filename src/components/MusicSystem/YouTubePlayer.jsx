import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { createPlayer } from "../../services/youtube/youtubePlayer";

const ELEMENT_ID = "last-bus-youtube-player";
const PROGRESS_POLL_MS = 250;

const isValidVideoId = (id) =>
  typeof id === "string" &&
  id.trim().length === 11;

const YouTubePlayer = forwardRef(function YouTubePlayer(
  {
    videoId,
    volume = 70,
    onReady,
    onStateChange,
    onError,
    onProgress,
    onAutoplayBlocked,
  },
  ref
) {
  const playerRef = useRef(null);
  const pollRef = useRef(null);
  const destroyedRef = useRef(false);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const emitProgress = () => {
    const player = playerRef.current;

    if (!player) return;

    try {
      const currentTime =
        typeof player.getCurrentTime === "function"
          ? Number(player.getCurrentTime()) || 0
          : 0;

      const duration =
        typeof player.getDuration === "function"
          ? Number(player.getDuration()) || 0
          : 0;

      onProgress?.({
        currentTime,
        duration,
      });
    } catch (error) {
      console.warn(
        "Progress update failed:",
        error
      );
    }
  };

  const startPolling = () => {
    stopPolling();

    emitProgress();

    pollRef.current = setInterval(() => {
      emitProgress();
    }, PROGRESS_POLL_MS);
  };

  useEffect(() => {
    let cancelled = false;

    destroyedRef.current = false;

    if (!isValidVideoId(videoId)) {
      return;
    }

    const initialize = async () => {
      try {
        const player = await createPlayer(
          ELEMENT_ID,
          {
            videoId: videoId.trim(),
            volume,

            onReady: (event) => {
              if (
                cancelled ||
                destroyedRef.current
              ) {
                return;
              }

              const target =
                event?.target;

              if (!target) return;

              playerRef.current =
                target;

              try {
                target.setVolume?.(
                  Math.min(
                    100,
                    Math.max(
                      0,
                      Number(volume) || 0
                    )
                  )
                );
              } catch (error) {
                console.warn(
                  "Volume setup failed:",
                  error
                );
              }

              /*
              IMPORTANT:
              Initial video load hoga,
              lekin automatically play nahi hoga.
              User Play button se start karega.
              */

              onReady?.(event);

              /*
              Metadata available hone ke liye
              ek initial progress update.
              */

              setTimeout(() => {
                if (!cancelled) {
                  emitProgress();
                }
              }, 500);
            },

            onStateChange: (event) => {
              if (
                cancelled ||
                destroyedRef.current
              ) {
                return;
              }

              /*
              PLAYING
              */

              if (event?.data === 1) {
                startPolling();
              }

              /*
              BUFFERING

              Progress polling continue rakho.
              */

              else if (event?.data === 3) {
                startPolling();
              }

              /*
              PAUSED / ENDED / CUED
              */

              else {
                stopPolling();
                emitProgress();
              }

              onStateChange?.(event);
            },

            onError: (event) => {
              if (
                cancelled ||
                destroyedRef.current
              ) {
                return;
              }

              stopPolling();

              console.error(
                "YouTube error:",
                event?.data
              );

              onError?.(event);
            },

            onAutoplayBlocked: (event) => {
              if (
                cancelled ||
                destroyedRef.current
              ) {
                return;
              }

              console.warn(
                "YouTube autoplay was blocked."
              );

              onAutoplayBlocked?.(
                event
              );
            },
          }
        );

        if (
          cancelled ||
          destroyedRef.current
        ) {
          try {
            player?.destroy?.();
          } catch {
            // ignore
          }

          return;
        }

        if (
          !playerRef.current &&
          player
        ) {
          playerRef.current =
            player;
        }
      } catch (error) {
        if (
          cancelled ||
          destroyedRef.current
        ) {
          return;
        }

        console.error(
          "YouTube player initialization failed:",
          error
        );

        onError?.({
          data: 0,
          error,
        });
      }
    };

    initialize();

    return () => {
      cancelled = true;

      destroyedRef.current =
        true;

      stopPolling();

      if (playerRef.current) {
        try {
          playerRef.current.destroy?.();
        } catch (error) {
          console.warn(
            "Player destroy failed:",
            error
          );
        }

        playerRef.current = null;
      }
    };

    /*
    IMPORTANT:

    Player sirf ek baar create hoga.

    videoId change hone par player destroy/recreate
    nahi hoga. MusicProvider direct loadVideoById()
    karega.
    */

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      /*
      ==============================================================
      LOAD + PLAY
      ==============================================================

      Next button ke liye main method.
      */

      loadAndPlay: (id) => {
        if (!isValidVideoId(id)) {
          console.warn(
            "Invalid video ID:",
            id
          );

          return false;
        }

        const player =
          playerRef.current;

        if (!player) {
          console.warn(
            "YouTube player is not ready."
          );

          return false;
        }

        try {
          /*
          YouTube documentation:
          loadVideoById() video ko load AND play karta hai.
          */

          player.loadVideoById(
            id.trim()
          );

          return true;
        } catch (error) {
          console.error(
            "loadAndPlay failed:",
            error
          );

          return false;
        }
      },

      /*
      ==============================================================
      LOAD WITHOUT PLAY
      ==============================================================
      */

      cueVideoById: (id) => {
        if (!isValidVideoId(id)) {
          return false;
        }

        const player =
          playerRef.current;

        if (!player) {
          return false;
        }

        try {
          player.cueVideoById(
            id.trim()
          );

          return true;
        } catch (error) {
          console.error(
            "Cue failed:",
            error
          );

          return false;
        }
      },

      /*
      ==============================================================
      PLAY CURRENT VIDEO
      ==============================================================
      */

      play: () => {
        const player =
          playerRef.current;

        if (!player) {
          return false;
        }

        try {
          player.playVideo?.();

          return true;
        } catch (error) {
          console.error(
            "Play failed:",
            error
          );

          return false;
        }
      },

      /*
      ==============================================================
      PAUSE
      ==============================================================
      */

      pause: () => {
        const player =
          playerRef.current;

        if (!player) {
          return false;
        }

        try {
          player.pauseVideo?.();

          return true;
        } catch (error) {
          console.error(
            "Pause failed:",
            error
          );

          return false;
        }
      },

      /*
      ==============================================================
      SEEK
      ==============================================================
      */

      seekTo: (seconds) => {
        const player =
          playerRef.current;

        if (!player) {
          return false;
        }

        const value =
          Number(seconds);

        if (
          !Number.isFinite(value)
        ) {
          return false;
        }

        try {
          player.seekTo(
            Math.max(0, value),
            true
          );

          setTimeout(
            emitProgress,
            50
          );

          return true;
        } catch (error) {
          console.error(
            "Seek failed:",
            error
          );

          return false;
        }
      },

      /*
      ==============================================================
      VOLUME
      ==============================================================
      */

      setVolume: (value) => {
        const player =
          playerRef.current;

        if (!player) return false;

        const numeric =
          Number(value);

        if (
          !Number.isFinite(numeric)
        ) {
          return false;
        }

        try {
          player.setVolume(
            Math.min(
              100,
              Math.max(
                0,
                numeric
              )
            )
          );

          return true;
        } catch {
          return false;
        }
      },

      /*
      ==============================================================
      MUTE
      ==============================================================
      */

      mute: () => {
        try {
          playerRef.current?.mute?.();
          return true;
        } catch {
          return false;
        }
      },

      /*
      ==============================================================
      UNMUTE
      ==============================================================
      */

      unMute: () => {
        try {
          playerRef.current?.unMute?.();
          return true;
        } catch {
          return false;
        }
      },

      /*
      ==============================================================
      GET CURRENT TIME
      ==============================================================
      */

      getCurrentTime: () => {
        try {
          return (
            Number(
              playerRef.current?.getCurrentTime?.()
            ) || 0
          );
        } catch {
          return 0;
        }
      },

      /*
      ==============================================================
      GET DURATION
      ==============================================================
      */

      getDuration: () => {
        try {
          return (
            Number(
              playerRef.current?.getDuration?.()
            ) || 0
          );
        } catch {
          return 0;
        }
      },

      /*
      ==============================================================
      GET PLAYER STATE
      ==============================================================
      */

      getPlayerState: () => {
        try {
          return (
            playerRef.current?.getPlayerState?.() ??
            -1
          );
        } catch {
          return -1;
        }
      },

      /*
      ==============================================================
      STOP
      ==============================================================
      */

      stop: () => {
        stopPolling();

        try {
          playerRef.current?.stopVideo?.();

          return true;
        } catch {
          return false;
        }
      },
    }),
    []
  );

  return (
    <div
      className="
        fixed
        bottom-0
        right-0
        h-px
        w-px
        overflow-hidden
        opacity-0
        pointer-events-none
      "
      aria-hidden="true"
    >
      <div id={ELEMENT_ID} />
    </div>
  );
});

export default YouTubePlayer;