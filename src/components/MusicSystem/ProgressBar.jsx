function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ProgressBar({ progress, duration, onSeek }) {
  return (
    <div className="flex w-full items-center gap-2">
      <span className="w-9 flex-shrink-0 text-right font-mono text-[10px] text-mist">
        {formatTime(progress)}
      </span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={Math.min(progress, duration || 0)}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Seek"
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-night-line"
        style={{ accentColor: "#E8954C" }}
      />
      <span className="w-9 flex-shrink-0 font-mono text-[10px] text-mist">
        {formatTime(duration)}
      </span>
    </div>
  );
}
