"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getFormDef } from "@/lib/data";
import { useAppState } from "@/lib/profile";
import { FormPreview } from "@/components/FormPreview";

// Clean, full-document print view (all pages) — print CSS expands the preview so
// the entire form prints, not just the visible page. Answers render as accepted
// (black) text.
export default function PrintPage() {
  const { formId } = useParams<{ formId: string }>();
  const { profile } = useAppState();
  const answers = profile.answers;
  const def = getFormDef(formId);
  if (!def) {
    return <p className="p-8 text-neutral-500">Form not found.</p>;
  }
  const allAnswered = [...new Set(def.fields.map((f) => f.group))].filter((g) =>
    (answers[g] ?? "").trim(),
  );

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/chat" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Back to chat
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          🖨 Print / Save as PDF
        </button>
      </div>
      <FormPreview formId={formId} answers={answers} approved={allAnswered} />
    </main>
  );
}
