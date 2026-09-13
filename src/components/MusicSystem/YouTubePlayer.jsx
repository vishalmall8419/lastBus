import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { createPlayer } from "../../services/youtube/youtubePlayer";

const ELEMENT_ID = "last-bus-youtube-player";

const PROGRESS_POLL_MS = 500;

const YouTubePlayer = forwardRef(function YouTubePlayer(
  {
    videoId,
    volume = 70,
    onReady,
    onStateChange,
    onError,
    onProgress,
  },
  ref
) {
  const playerRef = useRef(null);

  const pollRef = useRef(null);

  const cancelledRef = useRef(false);

  /* --------------------------------------------------
     Validate YouTube Video ID
  -------------------------------------------------- */

  const isValidVideoId = (id) => {
    return (
      typeof id === "string" &&
      id.trim().length === 11
    );
  };

  /* --------------------------------------------------
     Stop Progress Polling
  -------------------------------------------------- */

  const stopProgressPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  /* --------------------------------------------------
     Start Progress Polling
  -------------------------------------------------- */

  const startProgressPolling = () => {
    stopProgressPolling();

    pollRef.current = setInterval(() => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      if (
        typeof player.getCurrentTime !== "function"
      ) {
        return;
      }

      const currentTime =
        player.getCurrentTime();

      const duration =
        typeof player.getDuration === "function"
          ? player.getDuration()
          : 0;

      onProgress?.({
        currentTime:
          Number.isFinite(currentTime)
            ? currentTime
            : 0,

        duration:
          Number.isFinite(duration)
            ? duration
            : 0,
      });
    }, PROGRESS_POLL_MS);
  };

  /* ==================================================
     CREATE YOUTUBE PLAYER
  ================================================== */

  useEffect(() => {
    cancelledRef.current = false;

    /*
      Do not create the player when
      video ID is missing or invalid.
    */

    if (!isValidVideoId(videoId)) {
      stopProgressPolling();

      return;
    }

    /*
      Destroy previous player before
      creating a new one.
    */

    stopProgressPolling();

    if (playerRef.current) {
      try {
        playerRef.current.destroy?.();
      } catch (error) {
        console.warn(
          "Previous YouTube player destroy failed:",
          error
        );
      }

      playerRef.current = null;
    }

    /*
      Create the YouTube player.
    */

    createPlayer(ELEMENT_ID, {
      videoId,

      volume,

      onReady: (event) => {
        if (cancelledRef.current) {
          return;
        }

        const player =
          event?.target;

        if (!player) {
          return;
        }

        playerRef.current =
          player;

        /*
          Set initial volume.
        */

        try {
          player.setVolume?.(
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
            "Unable to set YouTube volume:",
            error
          );
        }

        /*
          IMPORTANT:

          Do NOT call playVideo()
          here.

          The video should remain
          paused/cued until the user
          presses Play.
        */

        onReady?.(event);
      },

      onStateChange: (event) => {
        if (cancelledRef.current) {
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

        if (event?.data === 1) {
          /*
            PLAYING
          */

          startProgressPolling();
        } else {
          /*
            PAUSED / ENDED /
            BUFFERING / CUED
          */

          stopProgressPolling();

          /*
            Send one final progress
            update when possible.
          */

          const player =
            playerRef.current;

          if (
            player &&
            typeof player.getCurrentTime ===
              "function"
          ) {
            const currentTime =
              player.getCurrentTime();

            const duration =
              typeof player.getDuration ===
                "function"
                ? player.getDuration()
                : 0;

            onProgress?.({
              currentTime:
                Number.isFinite(currentTime)
                  ? currentTime
                  : 0,

              duration:
                Number.isFinite(duration)
                  ? duration
                  : 0,
            });
          }
        }

        /*
          Forward original YouTube
          state event to MusicProvider.
        */

        onStateChange?.(event);
      },

      onError: (event) => {
        if (cancelledRef.current) {
          return;
        }

        stopProgressPolling();

        console.error(
          "YouTube Player Error:",
          event?.data
        );

        onError?.(event);
      },
    }).catch((error) => {
      if (cancelledRef.current) {
        return;
      }

      stopProgressPolling();

      console.error(
        "YouTube player initialization failed:",
        error
      );

      onError?.({
        data: 0,
        error,
      });
    });

    /* --------------------------------------------------
       Cleanup
    -------------------------------------------------- */

    return () => {
      cancelledRef.current = true;

      stopProgressPolling();

      if (playerRef.current) {
        try {
          playerRef.current.destroy?.();
        } catch (error) {
          console.warn(
            "YouTube player cleanup failed:",
            error
          );
        }

        playerRef.current = null;
      }
    };

    // Player must be recreated only
    // when videoId changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  /* ==================================================
     IMPERATIVE METHODS
  ================================================== */

  useImperativeHandle(
    ref,
    () => ({
      /* ----------------------------------------------
         Cue Video

         Loads the video but DOES NOT PLAY it.
      ---------------------------------------------- */

      cueVideoById: (id) => {
        if (!isValidVideoId(id)) {
          console.warn(
            "Invalid YouTube video ID:",
            id
          );

          return;
        }

        const player =
          playerRef.current;

        if (!player) {
          console.warn(
            "YouTube player is not ready yet."
          );

          return;
        }

        try {
          if (
            typeof player.cueVideoById ===
            "function"
          ) {
            player.cueVideoById(id);
          } else {
            console.warn(
              "cueVideoById is not available."
            );
          }
        } catch (error) {
          console.error(
            "Unable to cue YouTube video:",
            error
          );
        }
      },

      /* ----------------------------------------------
         Load Video

         NOTE:
         This method is kept for compatibility
         with existing code.

         It loads the video but does not
         manually call play().
      ---------------------------------------------- */

      loadVideoById: (id) => {
        if (!isValidVideoId(id)) {
          console.warn(
            "Invalid YouTube video ID:",
            id
          );

          return;
        }

        const player =
          playerRef.current;

        if (!player) {
          console.warn(
            "YouTube player is not ready yet."
          );

          return;
        }

        try {
          if (
            typeof player.loadVideoById ===
            "function"
          ) {
            player.loadVideoById(id);
          }
        } catch (error) {
          console.error(
            "Unable to load YouTube video:",
            error
          );
        }
      },

      /* ----------------------------------------------
         PLAY
      ---------------------------------------------- */

      play: () => {
        const player =
          playerRef.current;

        if (!player) {
          console.warn(
            "YouTube player is not ready."
          );

          return;
        }

        try {
          player.playVideo?.();
        } catch (error) {
          console.error(
            "Unable to play YouTube video:",
            error
          );
        }
      },

      /* ----------------------------------------------
         PAUSE
      ---------------------------------------------- */

      pause: () => {
        const player =
          playerRef.current;

        if (!player) {
          return;
        }

        try {
          player.pauseVideo?.();
        } catch (error) {
          console.error(
            "Unable to pause YouTube video:",
            error
          );
        }
      },

      /* ----------------------------------------------
         SEEK
      ---------------------------------------------- */

      seekTo: (seconds) => {
        const player =
          playerRef.current;

        if (!player) {
          return;
        }

        const value =
          Number(seconds);

        if (
          !Number.isFinite(value)
        ) {
          return;
        }

        try {
          player.seekTo(
            Math.max(0, value),
            true
          );
        } catch (error) {
          console.error(
            "Unable to seek YouTube video:",
            error
          );
        }
      },

      /* ----------------------------------------------
         SET VOLUME
      ---------------------------------------------- */

      setVolume: (value) => {
        const player =
          playerRef.current;

        if (!player) {
          return;
        }

        const numericValue =
          Number(value);

        if (
          !Number.isFinite(
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

        try {
          player.setVolume?.(
            safeValue
          );
        } catch (error) {
          console.error(
            "Unable to set YouTube volume:",
            error
          );
        }
      },

      /* ----------------------------------------------
         MUTE
      ---------------------------------------------- */

      mute: () => {
        try {
          playerRef.current?.mute?.();
        } catch (error) {
          console.error(
            "Unable to mute YouTube player:",
            error
          );
        }
      },

      /* ----------------------------------------------
         UNMUTE
      ---------------------------------------------- */

      unMute: () => {
        try {
          playerRef.current?.unMute?.();
        } catch (error) {
          console.error(
            "Unable to unmute YouTube player:",
            error
          );
        }
      },

      /* ----------------------------------------------
         CURRENT TIME
      ---------------------------------------------- */

      getCurrentTime: () => {
        try {
          return (
            playerRef.current
              ?.getCurrentTime?.() ?? 0
          );
        } catch {
          return 0;
        }
      },

      /* ----------------------------------------------
         DURATION
      ---------------------------------------------- */

      getDuration: () => {
        try {
          return (
            playerRef.current
              ?.getDuration?.() ?? 0
          );
        } catch {
          return 0;
        }
      },

      /* ----------------------------------------------
         PLAYER STATE
      ---------------------------------------------- */

      getPlayerState: () => {
        try {
          return (
            playerRef.current
              ?.getPlayerState?.() ?? -1
          );
        } catch {
          return -1;
        }
      },

      /* ----------------------------------------------
         STOP
      ---------------------------------------------- */

      stop: () => {
        stopProgressPolling();

        try {
          playerRef.current?.stopVideo?.();
        } catch (error) {
          console.error(
            "Unable to stop YouTube player:",
            error
          );
        }
      },
    }),
    []
  );

  /* ==================================================
     HIDDEN YOUTUBE PLAYER
  ================================================== */

  return (
    <div
      className="fixed bottom-0 right-0 h-px w-px overflow-hidden opacity-0 pointer-events-none"
      aria-hidden="true"
    >
      <div id={ELEMENT_ID} />
    </div>
  );
});

export default YouTubePlayer;