"use client";
import { useEffect, useRef, useState } from "react";
import { fetchFilledDoc } from "@/lib/client/api";

// Renders the live, filled DOCX (preview mode = plain colored answers) using
// docx-preview, re-rendering whenever answers change. Blue text = an answer.
export function FormPreview({
  formId,
  answers,
}: {
  formId: string;
  answers: Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const key = JSON.stringify(answers);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const blob = await fetchFilledDoc(formId, answers, "preview");
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        await renderAsync(blob, ref.current, undefined, {
          inWrapper: true,
          ignoreLastRenderedPageBreak: true,
          experimental: true,
        });
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formId, key]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-x-0 top-3 z-10 flex justify-center">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs text-neutral-500 shadow-sm">
            Updating preview…
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
