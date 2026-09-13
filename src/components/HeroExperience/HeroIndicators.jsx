export default function HeroIndicators({ count, activeIndex, onSelect }) {
  if (count <= 1) return null;

  return (
    <div
      className="flex items-center gap-2"
      role="tablist"
      aria-label="Hero slides"
    >
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Go to slide ${i + 1} of ${count}`}
            onClick={() => onSelect(i)}
            className="flex h-11 w-11 items-center justify-center focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className={`block h-2.5 w-2.5 rounded-full border transition-colors ${
                active
                  ? "border-amber bg-amber"
                  : "border-cream/40 bg-transparent hover:border-cream/70"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
