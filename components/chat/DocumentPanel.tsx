"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FORM_INDEX } from "@/lib/data";
import { warmFilledDoc } from "@/lib/client/api";
import { FormPreview } from "@/components/FormPreview";
import { AnswerList } from "./AnswerList";
import { PrinterIcon } from "@/components/icons";
import type { DocumentPanelProps } from "@/lib/chat/contracts";

// These exact strings are also listed in useChatFlow's CHROME so they are
// pre-translated (no English flicker) before the toggle renders.
const SUBMIT_NOTE =
  "This copy is translated so you can read it. Print the English copy to submit.";

// Role 3 (Document) owns this: form switcher + live preview + answer list.
export function DocumentPanel({
  activeForm,
  answers,
  activeValue,
  t,
  onSwitchForm,
  onEditField,
  lang,
  langLabel,
  done,
}: DocumentPanelProps) {
  const multilingual = lang !== "en";
  // While filling, show the applicant's language; once finished, flip to the
  // English submit copy. The applicant can switch at any time.
  const [showEnglish, setShowEnglish] = useState(!multilingual);
  useEffect(() => {
    setShowEnglish(!multilingual || done);
  }, [multilingual, done]);

  const previewLang = showEnglish ? undefined : lang;

  // Keep both the English and translated copies (and the English print copy)
  // generated in the background as answers come in, so toggling language or
  // hitting Print is instant instead of waiting on a re-translation.
  useEffect(() => {
    warmFilledDoc(activeForm, answers, "clean"); // /print uses clean English
    if (multilingual) {
      warmFilledDoc(activeForm, answers, "preview"); // English toggle
      warmFilledDoc(activeForm, answers, "preview", lang); // translated toggle
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeForm, JSON.stringify(answers), lang, multilingual]);

  return (
    <section className="flex min-h-0 flex-col">
      <div className="no-print mb-2 flex items-center justify-between gap-2">
        <select
          value={activeForm}
          onChange={(e) => onSwitchForm(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
        >
          {FORM_INDEX.map((f) => (
            <option key={f.id} value={f.id}>
              {f.code} — {f.title}
            </option>
          ))}
        </select>
        <Link
          href={`/print/${activeForm}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-ink/70 hover:bg-brand-tint"
        >
          <PrinterIcon className="h-4 w-4" />
          {t("Print")}
        </Link>
      </div>

      {multilingual && (
        <div className="no-print mb-2">
          <div className="inline-flex rounded-lg border border-neutral-300 p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setShowEnglish(false)}
              className={`rounded-md px-3 py-1 ${!showEnglish ? "bg-neutral-900 text-white" : "text-neutral-600"}`}
            >
              {langLabel}
            </button>
            <button
              type="button"
              onClick={() => setShowEnglish(true)}
              className={`rounded-md px-3 py-1 ${showEnglish ? "bg-neutral-900 text-white" : "text-neutral-600"}`}
            >
              English
            </button>
          </div>
          {!showEnglish && (
            <p className="mt-1 text-xs text-neutral-500">{t(SUBMIT_NOTE)}</p>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <FormPreview
          formId={activeForm}
          answers={answers}
          lang={previewLang}
          scrollToText={activeValue}
          onEditField={onEditField}
        />
        <div className="mt-3">
          <AnswerList formId={activeForm} answers={answers} t={t} onEdit={onEditField} />
        </div>
      </div>
    </section>
  );
}
