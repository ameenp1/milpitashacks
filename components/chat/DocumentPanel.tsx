"use client";
import Link from "next/link";
import { FORM_INDEX } from "@/lib/data";
import { FormPreview } from "@/components/FormPreview";
import { AnswerList } from "./AnswerList";
import type { DocumentPanelProps } from "@/lib/chat/contracts";

// Role 3 (Document) owns this: form switcher + live preview + answer list.
export function DocumentPanel({
  activeForm,
  answers,
  activeValue,
  t,
  onSwitchForm,
  onEditField,
}: DocumentPanelProps) {
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
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          🖨 {t("Print")}
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <FormPreview formId={activeForm} answers={answers} scrollToText={activeValue} />
        <div className="mt-3">
          <AnswerList formId={activeForm} answers={answers} t={t} onEdit={onEditField} />
        </div>
      </div>
    </section>
  );
}
