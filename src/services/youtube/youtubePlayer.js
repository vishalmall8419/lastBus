// YouTube IFrame Player API wrapper.
// Playback ONLY — this file never calls the YouTube Data API.
// Loads the IFrame API lazily and safely reuses the same promise.

let iframeApiPromise = null;

const YOUTUBE_IFRAME_API_URL =
  "https://www.youtube.com/iframe_api";

/* ==================================================
   Validate YouTube Video ID
================================================== */

function isValidVideoId(videoId) {
  return (
    typeof videoId === "string" &&
    videoId.trim().length === 11
  );
}

/* ==================================================
   Load YouTube IFrame Player API
================================================== */

export function loadYouTubeIframeApi() {
  if (iframeApiPromise) {
    return iframeApiPromise;
  }

  iframeApiPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(
        new Error(
          "No window — not a browser environment."
        )
      );

      return;
    }

    /* ----------------------------------------------
       API already available
    ---------------------------------------------- */

    if (
      window.YT &&
      typeof window.YT.Player === "function"
    ) {
      resolve(window.YT);

      return;
    }

    /* ----------------------------------------------
       Preserve existing callback
    ---------------------------------------------- */

    const previousCallback =
      window.onYouTubeIframeAPIReady;

    let resolved = false;

    const resolveYouTube = () => {
      if (resolved) {
        return;
      }

      if (
        window.YT &&
        typeof window.YT.Player === "function"
      ) {
        resolved = true;

        try {
          previousCallback?.();
        } catch (error) {
          console.warn(
            "Previous YouTube callback failed:",
            error
          );
        }

        resolve(window.YT);
      }
    };

    window.onYouTubeIframeAPIReady =
      resolveYouTube;

    /* ----------------------------------------------
       Check existing script
    ---------------------------------------------- */

    const existingScript =
      document.querySelector(
        `script[src="${YOUTUBE_IFRAME_API_URL}"]`
      );

    if (existingScript) {
      /*
        The script is already present.

        If it is still loading, the
        onYouTubeIframeAPIReady callback
        above will resolve the promise.
      */

      return;
    }

    /* ----------------------------------------------
       Inject YouTube IFrame API
    ---------------------------------------------- */

    const script =
      document.createElement("script");

    script.src =
      YOUTUBE_IFRAME_API_URL;

    script.async = true;

    script.onerror = () => {
      iframeApiPromise = null;

      reject(
        new Error(
          "Failed to load the YouTube IFrame API."
        )
      );
    };

    document.head.appendChild(script);
  });

  return iframeApiPromise;
}

/* ==================================================
   Create YouTube Player
================================================== */

export async function createPlayer(
  elementId,
  {
    videoId,
    volume = 70,
    onReady,
    onStateChange,
    onError,
  } = {}
) {
  /* ----------------------------------------------
     Validate Video ID
  ---------------------------------------------- */

  if (
    typeof videoId !== "string"
  ) {
    throw new Error(
      "YouTube video ID is missing."
    );
  }

  const cleanVideoId =
    videoId.trim();

  if (!cleanVideoId) {
    throw new Error(
      "YouTube video ID is empty."
    );
  }

  if (
    !isValidVideoId(
      cleanVideoId
    )
  ) {
    throw new Error(
      `Invalid YouTube video ID: "${cleanVideoId}"`
    );
  }

  /* ----------------------------------------------
     Validate Element ID
  ---------------------------------------------- */

  if (
    typeof elementId !== "string" ||
    !elementId.trim()
  ) {
    throw new Error(
      "YouTube player element ID is missing."
    );
  }

  /* ----------------------------------------------
     Make sure container exists
  ---------------------------------------------- */

  const element =
    document.getElementById(
      elementId
    );

  if (!element) {
    throw new Error(
      `YouTube player element "#${elementId}" was not found.`
    );
  }

  /* ----------------------------------------------
     Load IFrame API
  ---------------------------------------------- */

  const YT =
    await loadYouTubeIframeApi();

  if (
    !YT ||
    typeof YT.Player !== "function"
  ) {
    throw new Error(
      "YouTube IFrame API is not available."
    );
  }

  /* ----------------------------------------------
     Safe Volume
  ---------------------------------------------- */

  const numericVolume =
    Number(volume);

  const safeVolume =
    Number.isFinite(
      numericVolume
    )
      ? Math.min(
          100,
          Math.max(
            0,
            numericVolume
          )
        )
      : 70;

  /* ----------------------------------------------
     Create Player
  ---------------------------------------------- */

  const player =
    new YT.Player(
      elementId,
      {
        height: "1",
        width: "1",

        videoId:
          cleanVideoId,

        playerVars: {
          /*
            IMPORTANT:

            Never automatically play
            the video when the player
            is created.
          */
          autoplay: 0,

          controls: 0,

          disablekb: 1,

          fs: 0,

          modestbranding: 1,

          rel: 0,

          playsinline: 1,

          /*
            Origin helps YouTube identify
            the application correctly.
          */
          origin:
            window.location.origin,
        },

        events: {
          /* ----------------------------------------
             READY
          ---------------------------------------- */

          onReady: (event) => {
            try {
              event?.target?.setVolume?.(
                safeVolume
              );
            } catch (error) {
              console.warn(
                "Unable to set YouTube player volume:",
                error
              );
            }

            /*
              IMPORTANT:

              Do NOT call playVideo()
              here.
            */

            onReady?.(event);
          },

          /* ----------------------------------------
             STATE CHANGE
          ---------------------------------------- */

          onStateChange: (event) => {
            onStateChange?.(
              event
            );
          },

          /* ----------------------------------------
             ERROR
          ---------------------------------------- */

          onError: (event) => {
            console.error(
              "YouTube Player Error:",
              event?.data
            );

            onError?.(
              event
            );
          },
        },
      }
    );

  return player;
}