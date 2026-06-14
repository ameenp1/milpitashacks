// Small line icons (stroke = currentColor) used in place of emoji, matching the
// civic/library line-icon style. Size with className, e.g. <DocIcon className="h-5 w-5" />.
type P = { className?: string };

function S({
  className,
  children,
}: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const DocIcon = (p: P) => (
  <S {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </S>
);

export const HomeIcon = (p: P) => (
  <S {...p}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
    <path d="M10 20v-6h4v6" />
  </S>
);

export const CalendarIcon = (p: P) => (
  <S {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </S>
);

export const KeyIcon = (p: P) => (
  <S {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="M10.85 12.15 21 2M18 5l2 2M15 8l2 2" />
  </S>
);

export const FoodIcon = (p: P) => (
  <S {...p}>
    <path d="M4 11h16a8 8 0 0 1-8 8 8 8 0 0 1-8-8Z" />
    <path d="M12 11V7a3 3 0 0 1 3-3M6 21h12" />
  </S>
);

export const BusIcon = (p: P) => (
  <S {...p}>
    <rect x="4" y="4" width="16" height="13" rx="2" />
    <path d="M4 11h16M8 17v2M16 17v2" />
    <circle cx="8.5" cy="14" r=".6" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="14" r=".6" fill="currentColor" stroke="none" />
  </S>
);

export const ClockIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </S>
);

export const PhoneIcon = (p: P) => (
  <S {...p}>
    <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 6a2 2 0 0 1 2-2Z" />
  </S>
);

export const SpeakerIcon = (p: P) => (
  <S {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
    <path d="M16 9a4 4 0 0 1 0 6M18.5 7a7 7 0 0 1 0 10" />
  </S>
);

export const SpeakerOffIcon = (p: P) => (
  <S {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
    <path d="M22 9l-5 6M17 9l5 6" />
  </S>
);

export const MicIcon = (p: P) => (
  <S {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </S>
);

export const EyeIcon = (p: P) => (
  <S {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </S>
);

export const EyeOffIcon = (p: P) => (
  <S {...p}>
    <path d="M3 3l18 18M10.5 6.2A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3 3.7M6.3 8.3A16 16 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 3.7-.7" />
    <path d="M9.5 10.5a3 3 0 0 0 4 4" />
  </S>
);

export const PrinterIcon = (p: P) => (
  <S {...p}>
    <path d="M6 9V3h12v6" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="7" rx="1" />
  </S>
);

export const LockIcon = (p: P) => (
  <S {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </S>
);

export const RefreshIcon = (p: P) => (
  <S {...p}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v4h-4" />
  </S>
);

export const MonitorIcon = (p: P) => (
  <S {...p}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M9 20h6M12 16v4" />
  </S>
);

export const ExternalIcon = (p: P) => (
  <S {...p}>
    <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </S>
);
