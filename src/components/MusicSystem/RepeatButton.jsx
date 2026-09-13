import { memo } from "react";

const NEXT_MODE = { off: "all", all: "one", one: "off" };
const LABEL = { off: "Repeat off", all: "Repeat all", one: "Repeat one" };

function RepeatButton({ repeatMode, onCycle }) {
  const active = repeatMode !== "off";
  return (
    <button
      type="button"
      aria-label={LABEL[repeatMode]}
      aria-pressed={active}
      onClick={() => onCycle(NEXT_MODE[repeatMode])}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs transition-colors ${
        active ? "text-amber" : "text-cream/50 hover:text-cream/80"
      }`}
    >
      <span aria-hidden="true">{repeatMode === "one" ? "🔂" : "🔁"}</span>
    </button>
  );
}

export default memo(RepeatButton);
