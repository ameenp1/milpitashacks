"use client";
import { useEffect, useRef, useState } from "react";
import { fetchFilledDoc } from "@/lib/client/api";

// Renders the live, filled DOCX (preview mode) with docx-preview, re-rendering
// when answers/approval change. Pending answers show as blue underlined
// insertions; approved answers as near-black accepted text. When scrollToText
// is set, scrolls the just-filled value into view.
export function FormPreview({
  formId,
  answers,
  approved,
  scrollToText,
}: {
  formId: string;
  answers: Record<string, string>;
  approved?: string[];
  scrollToText?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const key = JSON.stringify({ answers, approved });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const blob = await fetchFilledDoc(formId, answers, "preview", approved);
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        await renderAsync(blob, ref.current, undefined, {
          inWrapper: true,
          ignoreLastRenderedPageBreak: true,
          experimental: true,
        });
        if (!cancelled && scrollToText) scrollToValue(ref.current, scrollToText);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formId, key, scrollToText]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-x-0 top-3 z-10 flex justify-center">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs text-neutral-500 shadow-sm">
            Updating form…
          </span>
        </div>
      )}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load the form preview. Your answers are still saved.
        </p>
      ) : (
        <div
          ref={ref}
          className="docx-host max-h-[72vh] overflow-auto rounded-xl border border-neutral-200 bg-neutral-100 p-3"
        />
      )}
    </div>
  );
}

// Find the rendered run whose text contains `text` and scroll it into view,
// briefly highlighting it.
function scrollToValue(container: HTMLElement, text: string) {
  const needle = text.trim().slice(0, 24);
  if (!needle) return;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.textContent && node.textContent.includes(needle)) {
      const el = node.parentElement;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.transition = "background-color 1.2s";
        el.style.backgroundColor = "#fde68a";
        setTimeout(() => (el.style.backgroundColor = "transparent"), 1400);
      }
      return;
    }
  }
}
