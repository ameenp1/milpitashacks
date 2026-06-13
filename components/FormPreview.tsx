"use client";
import { useEffect, useRef, useState } from "react";
import { fetchFilledDoc } from "@/lib/client/api";
import { getFormDef } from "@/lib/data";

// Renders the live, filled DOCX (preview mode) with docx-preview, re-rendering
// when answers change. Answers show as blue underlined insertions (always
// accepted now — no approve step). After each render we:
//   • scroll to + highlight the field that was just answered (located by its
//     unique anchor label, not a fragile value-text search), and
//   • when onEditField is provided, make each answered value clickable so the
//     user can edit it inline, right on the document (revisions_2 L3/L6/L7).
export function FormPreview({
  formId,
  answers,
  mode = "preview",
  lang,
  scrollToText,
  onEditField,
}: {
  formId: string;
  answers: Record<string, string>;
  mode?: "preview" | "clean";
  // Non-English -> render the translated "your-language copy". Inline editing /
  // scroll-highlight are anchored to English labels, so they're disabled there.
  lang?: string;
  scrollToText?: string;
  onEditField?: (group: string, value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const translated = !!lang && lang !== "en";
  const key = JSON.stringify({ answers, mode, lang });

  // Keep the latest edit callback in a ref so re-rendering with a new function
  // identity doesn't force a (network) re-fetch of the document.
  const onEditRef = useRef(onEditField);
  onEditRef.current = onEditField;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const blob = await fetchFilledDoc(formId, answers, mode, lang);
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        await renderAsync(blob, ref.current, undefined, {
          inWrapper: true,
          ignoreLastRenderedPageBreak: true,
          experimental: true,
        });
        if (!cancelled && ref.current) {
          // The translated copy's labels/values aren't the English anchors the
          // decorator keys off, so only decorate the English document.
          if (!translated) {
            decorate(ref.current, formId, answers, scrollToText, onEditRef.current);
          }
          fitToWidth(ref.current);
        }
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

  // Re-fit the rendered page to the panel whenever the panel is resized.
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const ro = new ResizeObserver(() => fitToWidth(host));
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-x-0 top-3 z-10 flex justify-center">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs text-neutral-500 shadow-sm">
            {translated ? "Translating form…" : "Updating form…"}
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

// Scale the full-size Word pages down to fit the panel width (like Word's
// "fit to width" zoom), preserving the real page layout. Transform doesn't
// shrink the layout box, so we pull up the freed vertical space with a negative
// margin to avoid a tall empty gap below the document.
function fitToWidth(host: HTMLElement) {
  const wrapper = host.querySelector<HTMLElement>(".docx-wrapper");
  const page = host.querySelector<HTMLElement>("section.docx");
  if (!wrapper || !page) return;
  wrapper.style.transform = "";
  wrapper.style.marginBottom = "";
  const pageW = page.offsetWidth; // true Word page width (may overflow the panel)
  const natH = wrapper.offsetHeight;
  if (!pageW) return;
  const avail = host.clientWidth - 24; // host has p-3 (12px each side)
  const scale = Math.min(1, avail / pageW);
  if (scale >= 1) return;
  wrapper.style.transformOrigin = "top left";
  wrapper.style.transform = `scale(${scale})`;
  wrapper.style.marginBottom = `${-(natH * (1 - scale))}px`;
}

const norm = (s: string | null) => (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();

// After docx-preview renders, locate each answered field by its anchor label and
// (a) wire inline editing on its value span, (b) scroll/highlight the active one.
function decorate(
  container: HTMLElement,
  formId: string,
  answers: Record<string, string>,
  activeValue: string | undefined,
  onEditField?: (group: string, value: string) => void,
) {
  const def = getFormDef(formId);
  if (!def) return;

  // One entry per group (cross-fill), in document order, that has an answer.
  const seen = new Set<string>();
  const items: { group: string; anchor: string; value: string }[] = [];
  for (const f of def.fields) {
    if (seen.has(f.group)) continue;
    const value = (answers[f.group] ?? "").trim();
    if (!value) continue;
    seen.add(f.group);
    items.push({ group: f.group, anchor: f.anchor, value });
  }

  // The just-answered field = the group whose value equals the active value.
  const wanted = (activeValue ?? "").trim();
  const activeGroup = wanted
    ? items.find((i) => i.value === wanted)?.group
    : undefined;

  const blocks = Array.from(container.querySelectorAll("p"));
  let highlighted = false;

  for (const it of items) {
    const block = blocks.find((b) => norm(b.textContent).includes(norm(it.anchor)));
    if (!block) continue;
    const span = valueSpan(block, it.value);
    if (!span) continue;
    if (onEditField) makeEditable(span, it.group, it.value, onEditField);
    if (it.group === activeGroup) {
      highlight(span);
      highlighted = true;
    }
  }

  // Fallback: if the anchor lookup didn't pin the active field, do a plain text
  // search so we still scroll somewhere sensible.
  if (wanted && !highlighted) {
    const span = blocks
      .flatMap((b) => Array.from(b.querySelectorAll("span")))
      .find((s) => norm(s.textContent).includes(norm(wanted).slice(0, 24)));
    if (span) highlight(span);
  }
}

// Within an anchor paragraph, the injected answer run is appended last, so the
// last span whose text matches the value is the field we filled.
function valueSpan(block: HTMLElement, value: string): HTMLElement | null {
  const spans = Array.from(block.querySelectorAll("span")) as HTMLElement[];
  const exact = spans.filter((s) => (s.textContent ?? "").trim() === value);
  if (exact.length) return exact[exact.length - 1];
  const partial = spans.filter((s) => (s.textContent ?? "").includes(value));
  return partial.length ? partial[partial.length - 1] : null;
}

function highlight(el: HTMLElement) {
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.transition = "background-color 1.4s ease";
  el.style.backgroundColor = "#fde68a";
  el.style.borderRadius = "3px";
  setTimeout(() => {
    el.style.backgroundColor = "transparent";
  }, 1600);
}

function makeEditable(
  span: HTMLElement,
  group: string,
  value: string,
  onEditField: (group: string, value: string) => void,
) {
  span.style.cursor = "pointer";
  span.title = "Click to edit";
  span.addEventListener("click", () => {
    if (span.isContentEditable) return;
    span.contentEditable = "true";
    span.focus();
    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const commit = () => {
      span.contentEditable = "false";
      span.removeEventListener("blur", commit);
      const next = (span.textContent ?? "").trim();
      if (next && next !== value) onEditField(group, next);
    };
    span.addEventListener("blur", commit, { once: true });
    span.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        span.blur();
      } else if (e.key === "Escape") {
        span.textContent = ` ${value}`;
        span.blur();
      }
    });
  });
}
