import { memo } from "react";

/**
 * Toggles Radio Mode: when on, the pool is topped up with fresh discovery
 * results as the current one runs low (see useRadioMode.js). When off, the
 * app just keeps cycling whatever's already been fetched — no further
 * search.list calls, which is also a reasonable "keep it simple" choice for
 * someone who wants a fixed, quota-free set rather than an endless feed.
 */
function RadioMode({ isRadioMode, onToggle }) {
  return (
    <button
      type="button"
      aria-pressed={isRadioMode}
      aria-label={isRadioMode ? "Radio Mode on — tap to turn off" : "Radio Mode off — tap to turn on"}
      onClick={onToggle}
      className={`lb-dash-badge transition-colors ${
        isRadioMode ? "border-amber/50 text-amber" : "text-mist/70"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isRadioMode ? "bg-amber animate-flicker motion-reduce:animate-none" : "bg-mist/50"
        }`}
        aria-hidden="true"
      />
      <span>{isRadioMode ? "ON AIR" : "RADIO OFF"}</span>
    </button>
  );
}

export default memo(RadioMode);
