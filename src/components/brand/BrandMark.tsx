interface BrandMarkProps {
  variant?: "light" | "dark";
  showWordmark?: boolean;
  className?: string;
}

/**
 * SingleStop brand mark — a stacked monogram inside a refined gold rule.
 * Replace by swapping the SVG when the official logo file is provided.
 */
export function BrandMark({ variant = "dark", showWordmark = true, className }: BrandMarkProps) {
  const ink = variant === "light" ? "var(--ivory)" : "var(--navy-deep)";
  const gold = "var(--gold)";

  return (
    <div className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
        <rect x="1" y="1" width="34" height="34" rx="6" stroke={gold} strokeWidth="1" />
        <path
          d="M11 22.5c1.4 1.5 3.4 2.3 5.6 2.3 3.1 0 5.2-1.4 5.2-3.6 0-2-1.4-3-4.6-3.7l-1.7-.4c-2-.5-3-1.2-3-2.6 0-1.6 1.4-2.6 3.6-2.6 1.7 0 3.1.5 4.4 1.6"
          stroke={ink}
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="26" cy="11" r="1.4" fill={gold} />
      </svg>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className="font-display text-[17px] font-semibold tracking-tight"
            style={{ color: ink }}
          >
            SingleStop
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.22em] mt-0.5"
            style={{ color: gold }}
          >
            Building Solutions
          </span>
        </div>
      )}
    </div>
  );
}
