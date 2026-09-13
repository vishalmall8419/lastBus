export default function BrandMark({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M6 22 L16 8 L26 22"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="22" r="2" fill="currentColor" />
    </svg>
  );
}
