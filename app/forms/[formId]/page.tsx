"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getFormDef, getGroup } from "@/lib/data";
import { useAppState, setAnswer, markReviewed } from "@/lib/profile";
import { fieldStatus, formProgress, formStatus, type FieldStatus } from "@/lib/status";
import { QuestionCard } from "@/components/QuestionCard";
import { FormPreview } from "@/components/FormPreview";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";

const statusChip: Record<FieldStatus, string> = {
  filled: "bg-blue-50 text-blue-700 border-blue-200",
  review: "bg-amber-50 text-amber-800 border-amber-200",
  missing: "bg-neutral-50 text-neutral-500 border-neutral-200",
};
const statusText: Record<FieldStatus, string> = {
  filled: "Filled from your profile",
  review: "Needs your review",
  missing: "Missing",
};

export default function FormPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, reviewed } = useAppState();
  const answers = profile.answers;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [soundOn, setSoundOn] = useState(true);

  const def = getFormDef(formId);
  if (!def) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-neutral-500">That form was not found.</p>
        <Link href="/forms" className="mt-4 inline-block underline">
          Back to my forms
        </Link>
      </main>
    );
  }

  const groupIds = [...new Set(def.fields.map((f) => f.group))];
  const entries = groupIds.map((id) => {
    const field = def.fields.find((f) => f.group === id)!;
    return { group: getGroup(id)!, field, status: fieldStatus(field, answers) };
  });
  const pending = entries.filter(
    (e) => e.status !== "filled" && !skipped.has(e.group.id),
  );
  const currentId = editingId ?? pending[0]?.group.id ?? null;
  const current = entries.find((e) => e.group.id === currentId) ?? null;

  const prog = formProgress(def, answers);
  const status = formStatus(def, answers, reviewed.includes(formId));
  const answered = entries.filter((e) => e.status !== "missing").length;

  function complete() {
    markReviewed(formId, true);
    showToast("Marked complete. Great work.", "success");
    router.push("/forms");
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/forms" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← All forms
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            🖨 Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={() => setSoundOn((s) => !s)}
            className="rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            {soundOn ? "🔊 Sound on" : "🔇 Sound off"}
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 print:block">
        {/* Guided Q&A */}
        <div className="print:hidden">
          <div className="mb-4">
            <div className="text-xs font-medium tracking-wide text-neutral-500">
              {def.code}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{def.title}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              {answered} of {entries.length} answered for this form
            </p>
          </div>

          {current ? (
            <QuestionCard
              key={current.group.id}
              group={current.group}
              value={answers[current.group.id] ?? ""}
              language={profile.language}
              soundOn={soundOn}
              onAnswer={(v) => {
                setAnswer(current.group.id, v);
                setEditingId(null);
              }}
              onSkip={() => {
                setSkipped((s) => new Set(s).add(current.group.id));
                setEditingId(null);
              }}
            />
          ) : (
            <div className="rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-xl font-semibold">Review this form</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Check each answer. Tap any line to change it.
              </p>
              <ul className="mt-4 divide-y divide-neutral-100">
                {entries.map((e) => (
                  <li
                    key={e.group.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-800">
                        {e.group.question}
                      </div>
                      <div className="truncate text-sm text-neutral-500">
                        {answers[e.group.id] || "—"}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${statusChip[e.status]}`}
                      >
                        {statusText[e.status]}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSkipped((s) => {
                            const n = new Set(s);
                            n.delete(e.group.id);
                            return n;
                          });
                          setEditingId(e.group.id);
                        }}
                        className="rounded-lg border border-neutral-200 px-3 py-1 text-xs hover:bg-neutral-50"
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={prog.missing > 0}
                onClick={complete}
                className="mt-6 w-full rounded-xl bg-neutral-900 px-6 py-4 text-lg font-medium text-white hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                {prog.missing > 0
                  ? `${prog.missing} field${prog.missing > 1 ? "s" : ""} still missing`
                  : "This looks correct — mark complete"}
              </button>
            </div>
          )}
        </div>

        {/* Live preview */}
        <div>
          <div className="no-print mb-3 flex flex-wrap gap-3 text-xs text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-200" /> Filled from your profile
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-amber-400 bg-amber-100" /> Needs review
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-neutral-300" /> Missing (____)
            </span>
          </div>
          <FormPreview formId={formId} answers={answers} />
        </div>
      </div>
    </main>
  );
}
