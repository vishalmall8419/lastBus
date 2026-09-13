import { memo } from "react";

function ShuffleButton({ isShuffled, onToggle }) {
  return (
    <button
      type="button"
      aria-label={isShuffled ? "Shuffle on" : "Shuffle off"}
      aria-pressed={isShuffled}
      onClick={onToggle}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs transition-colors ${
        isShuffled ? "text-amber" : "text-cream/50 hover:text-cream/80"
      }`}
    >
      <span aria-hidden="true">🔀</span>
    </button>
  );
}

export default memo(ShuffleButton);
