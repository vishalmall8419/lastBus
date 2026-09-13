# LAST BUS

A late-night Indian bus journey, told through a cinematic hero carousel and a 90s YouTube-powered radio. Frontend-only — no backend, no database, no login/admin. See the architecture docs shared separately for the full design.

## Setup

```bash
npm install
cp .env.example .env      # then fill in VITE_YOUTUBE_API_KEY
npm run dev
```

The YouTube API key is read from `import.meta.env.VITE_YOUTUBE_API_KEY`. It will be visible in browser network requests — that's expected for a frontend-only app. Before deploying, restrict the key in Google Cloud Console:
- **HTTP referrer restriction** → your deployed domain(s)
- **API restriction** → YouTube Data API v3 only

## Design tokens (Phase 1)

| Token | Value | Role |
|---|---|---|
| `night` | `#0B0E14` | Base background — night sky through a bus window |
| `night-panel` | `#12161F` | Raised surfaces (player shell, cards) |
| `amber` | `#E8954C` | Primary accent — sodium-vapor highway lamp / headlight glow |
| `rexine` | `#9B3A34` | Secondary accent, used sparingly — bus-seat red |
| `mist` | `#8A93A6` | Muted secondary text |
| `cream` | `#F4EEE2` | Primary text — warm off-white, like painted bus signage |

Fonts: **Yatra One** (display, used sparingly for the wordmark/titles), **Manrope** (UI/body), **IBM Plex Mono** (journey clock, route numbers, timestamps).

Signature element: the **destination-board strip** pinned to the bottom of the viewport — a nod to the actual route boards on Indian buses. It's a placeholder marquee for now; later phases will feed it live journey/route data.

## Current status: Phase 12 (Final QA) — as far as this can honestly go, plus a real bug fix from user testing, plus one new feature

---

### New feature: autonomous Journey Clock progression

The architecture always described the Journey Clock as an "optional future feature" (§26): the simulated time progressing on its own as the journey goes on, independent of which hero slide happens to be showing — a real night bus ride doesn't reset just because you glanced out a different window. That was never built until now.

- **`hooks/useJourneyClock.js`** — six fixed checkpoints (11:47 PM → 12:15 AM → 1:05 AM → 2:20 AM → 4:45 AM → 5:30 AM), each paired with a narrative mood (midnight → midnight → dhaba → midnight → dawn → dawn). Advances one checkpoint every ~45s of real time, **only once the journey has actually started** — while idle, it stays parked and runs no timer at all. Stops at the last checkpoint rather than looping (a journey has an end).
- **`App.jsx`** — `journeyTime` now has two sources: the hero slide's own time before "Enter Journey" (unchanged from earlier phases), and the autonomous clock once the journey starts. Checkpoint changes feed the *same* suggest-never-auto-switch mood bridge the Hero already uses (`resolveMoodChange`), so reaching "dawn" late in a session can suggest switching to Subah Hone Wali Hai, exactly like a Hero slide change would — one shared mechanism, two sources feeding it, not two parallel systems.
- Skips its own first checkpoint for suggestions (mirrors the Hero's existing `isFirstSlideChange` guard) so starting a journey never immediately second-guesses the mood you just deliberately picked.
- **`JourneyClock.jsx`** gained a quiet `isComplete` visual cue — the flickering dot goes steady once the journey reaches its final checkpoint.

**Still unverified like everything else in this app** — the timer-based progression and its interaction with the existing mood-suggestion system is new code that hasn't been executed. Please check: journey clock actually advances every ~45s once started (not before), suggestions appear at mood-changing checkpoints without interrupting playback, and the dot goes steady at the final checkpoint.

---

### Post-Phase-12 fix: audio silently blocked on first play (confirmed by actual testing)

**Symptom reported:** song title/thumbnail shows as "playing," but no audio plays and the progress time never moves.

**Root cause:** by the time the YouTube IFrame Player actually finishes initializing (script load + `onReady`), real time has usually passed since the "Enter Journey" click — often enough that browsers no longer treat the resulting `loadVideoById()` as user-initiated, so they silently block audio. The UI still optimistically showed "playing" because that was dispatched immediately; the progress bar never moved because it only starts polling once YouTube's *real* "playing" event fires, which it never did.

**Fix (`MusicProvider.jsx`):** the very first video ever loaded now starts **muted** — muted autoplay is permitted by every browser regardless of gesture timing — and is automatically unmuted the instant YouTube confirms real playback has started (`onStateChange` reports state `1`). Every song after that first one plays normally at full volume immediately, since browsers allow subsequent programmatic plays once media has already played once on the page. If the person had already muted via the volume control, that preference is respected and the auto-unmute is skipped.

**This is exactly the failure mode flagged as the single biggest risk starting back in the Phase 4 writeup** — confirmed by real testing, now fixed. It's a strong signal to keep working through `QA_CHECKLIST.md`, since it's now demonstrated that "the code reads correctly" and "the code works" can diverge in exactly the way I kept warning about.

---

**Phase 1** — Vite + Tailwind foundation, folder structure, design tokens, base responsive layout.

**Phase 2** — full-screen Hero Carousel with Ken Burns, crossfade, autoplay, swipe/keyboard, reduced-motion handling.

**Phase 3** — visual identity pass: nav bar, brand mark, Journey Clock.

**Phase 4** — YouTube integration: Data API discovery, IFrame Player playback, basic play/pause/next/prev/volume/seek.

**Phase 5** — Smart Shuffle, Radio Mode, Queue (history), SongAttribution.

**Phase 6** — mood-based playlists (9 virtual playlists, Hero↔Music mood bridge).

**Phase 7** — text search (debounced, paginated, cancel-aware).

**Phase 8** — LocalStorage/SessionStorage persistence.

**Phase 9** — Rain Effect, mood-synced.

**Phase 10** — mobile mini-player + expandable bottom sheet.

**Phase 11** — performance pass (caching, memoization) + 2 real bugs caught.

**Phase 12 (this update) — see `QA_CHECKLIST.md` for the full writeup.** The original Phase 12 scope is cross-browser/device/network testing, which I have no ability to perform in this sandbox — no browser, no device, no network access to `googleapis.com`/`youtube.com`. What I did instead: a dedicated static-audit pass across every file against every other file it touches (not just the most recently changed ones), plus a consolidated manual checklist replacing the scattered "please verify" notes from Phases 1-11.

**The audit found and fixed three more real, shipped bugs** on top of the two caught in Phase 11:
- A dead Phase 1 stub (`hooks/useYouTube.js`) that nothing ever imported, left behind when its responsibilities moved into `MusicProvider.jsx` — removed.
- Phase 11's own `fetchPriority` attribute was written with the wrong casing (lowercase `fetchpriority`), which React 18.3+ most likely warns about — fixed.
- The Hero's dot indicators were visually 10px with **zero padding**, meaning their actual tappable area was ~10px against the brief's explicit 44px minimum touch target — fixed by adding a proper hit-area around each small visual dot.

**Five real bugs, twelve phases, zero of them caught by execution** — every one was found by a human-style re-read catching something a previous pass missed. That's the honest summary of where this project stands: the architecture holds up under scrutiny, cross-file consistency checked out clean, but "reads correctly on careful review" and "has been shown to work" are different claims, and only the second one is what Phase 12 was actually supposed to deliver.

**`QA_CHECKLIST.md`** has the full consolidated manual test list — I'd start with the Mobile section, since Phase 10's rewrite plus Phase 11's `VolumeControl` fix are the most recently-changed, least-executed code in the app.

## Folder structure

```
src/
├── components/
│   ├── HeroExperience/   (Phase 2)
│   ├── Navigation/       (Phase 3 — brand mark + top bar)
│   ├── MusicSystem/      (Phase 4–7, includes SongAttribution.jsx for per-song copyright notice)
│   ├── RainEffect/       (Phase 9)
│   └── JourneyClock/     (Phase 3 — implemented; time synced from the active hero slide)
├── context/              (Phase 4)
├── data/                 (Phase 2, 6)
├── hooks/                (Phase 2, 4, 5, 8)
├── services/youtube/     (Phase 4, 7 — discovery and playback kept in separate files)
└── utils/                (Phase 5, 7, 8)
```
