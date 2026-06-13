"use client";
import { useRef, useState } from "react";

// Right panel: the live BenefitsCal application rendered in an iframe, with a
// small browser-style toolbar. Government portals sometimes break out of frames
// or block cookies in them, so we always offer "Open in new tab" as a fallback.
const APPLY_URL = "https://benefitscal.com/ApplyForBenefits/begin/ABOVR?lang=en";

export function BrowserPanel({ t }: { t: (s: string) => string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [nonce, setNonce] = useState(0); // bump to force a reload

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200">
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          aria-label={t("Reload")}
          className="rounded-md px-1.5 py-0.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
        >
          ↻
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-500">
          <span aria-hidden>🔒</span>
          <span className="truncate">benefitscal.com</span>
        </div>
        <a
          href={APPLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
        >
          {t("Open in new tab")} ↗
        </a>
      </div>
      <iframe
        key={nonce}
        ref={frameRef}
        src={APPLY_URL}
        title="BenefitsCal application"
        className="min-h-0 flex-1 bg-white"
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation-by-user-activation"
      />
    </section>
  );
}
