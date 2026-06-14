import Link from "next/link";

export function BrandLogo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="HousingAId home"
      className={`inline-flex items-center text-neutral-900 ${className}`}
    >
      <svg
        viewBox={compact ? "0 0 126 92" : "0 0 470 120"}
        role="img"
        aria-hidden="true"
        className={compact ? "h-10 w-auto" : "h-16 w-auto sm:h-20"}
      >
        <g fill="currentColor">
          <path d="M34 91V24h18v34c6-9 14-13 25-13 18 0 30 13 30 34v12H88V78c0-11-5-17-15-17-12 0-21 9-21 25v5H34Z" opacity=".82" />
          <path d="M8 46 75 0l65 46-9 15-56-39-58 39-9-15Z" />
          <rect x="112" y="12" width="20" height="29" rx="3" />
          <circle cx="118" cy="21" r="2.2" fill="#f7f6f1" />
          <circle cx="124" cy="21" r="2.2" fill="#f7f6f1" />
          <circle cx="130" cy="21" r="2.2" fill="#f7f6f1" />
        </g>
        {!compact && (
          <g fill="currentColor">
            <text
              x="104"
              y="88"
              fontFamily="Arial Black, Arial, Helvetica, sans-serif"
              fontSize="62"
              fontWeight="900"
              letterSpacing="-1"
            >
              ousingAId
            </text>
            <path d="M358 92h88v9h-88z" />
          </g>
        )}
      </svg>
    </Link>
  );
}
