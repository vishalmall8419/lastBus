/**
 * A small "bus dashboard" readout showing the journey's simulated time.
 * Purely decorative/atmospheric, so it stays aria-hidden.
 *
 * `time` comes from one of two sources depending on where the person is in
 * the experience (see App.jsx): before "Enter Journey", it mirrors whatever
 * hero slide is showing; once the journey has actually started, it switches
 * to useJourneyClock's own autonomous progression, which keeps advancing
 * independently of which hero slide happens to be on screen. Either way,
 * this component doesn't know or care which source it's reading from — the
 * time is a visual simulation, not a real clock, per the architecture.
 *
 * `isComplete` (only meaningful once the journey clock is driving) swaps
 * the flickering dot for a steady one — a small, quiet signal that the
 * simulated journey has reached its last checkpoint.
 */
export default function JourneyClock({ time, isComplete = false }) {
  if (!time) return null;

  return (
    <div
      className="lb-dash-badge"
      aria-label={`Current India time: ${time}`}
      title="Current India Standard Time"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full bg-amber ${
          isComplete ? "" : "animate-flicker motion-reduce:animate-none"
        }`}
        aria-hidden="true"
      />
      <span>{time}</span>
      <span className="sr-only">IST</span>
    </div>
  );
}
