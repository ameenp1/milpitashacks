"use client";
import { useRef, useState } from "react";
import { RefreshIcon, LockIcon, ExternalIcon } from "@/components/icons";

// Right panel: the live BenefitsCal application rendered in an iframe, with a
// small browser-style toolbar. Government portals sometimes break out of frames
// or block cookies in them, so we always offer "Open in new tab" as a fallback.
const APPLY_URL = "https://benefitscal.com/ApplyForBenefits/begin/ABOVR?lang=en";

export function BrowserPanel({ t }: { t: (s: string) => string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [nonce, setNonce] = useState(0); // bump to force a reload

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-line">
      <div className="flex items-center gap-2 border-b border-line bg-neutral-50 px-3 py-2">
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          aria-label={t("Reload")}
          className="rounded-md p-1 text-ink/50 hover:bg-neutral-200 hover:text-navy"
        >
          <RefreshIcon className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs text-ink/55">
          <LockIcon className="h-3.5 w-3.5" />
          <span className="truncate">benefitscal.com</span>
        </div>
        <a
          href={APPLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink/70 hover:border-brand hover:text-brand"
        >
          {t("Open in new tab")}
          <ExternalIcon className="h-3.5 w-3.5" />
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
