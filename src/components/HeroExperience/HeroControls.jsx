export default function HeroControls({ onPrev, onNext, count }) {
  if (count <= 1) return null;

  const baseClasses =
    "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 bg-night/30 text-cream/80 backdrop-blur-sm transition-colors hover:border-amber/60 hover:text-amber focus-visible:border-amber/60 focus-visible:text-amber";

  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-3 sm:px-6">
      <button type="button" aria-label="Previous slide" onClick={onPrev} className={baseClasses}>
        <span aria-hidden="true">‹</span>
      </button>
      <button type="button" aria-label="Next slide" onClick={onNext} className={baseClasses}>
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}
