"use client";
import Link from "next/link";
import { FORM_INDEX, getFormDef, getGroup } from "@/lib/data";
import { useAppState } from "@/lib/profile";
import { fieldStatus, formStatus } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteButton } from "@/components/DeleteButton";
import { fetchFilledDoc } from "@/lib/client/api";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import {
  assessEligibility,
  ELIGIBILITY_STRINGS,
  ELIGIBILITY_IMMEDIATE,
} from "@/lib/eligibility";

const SUMMARY_FIELDS = [
  "full_name",
  "dob",
  "phone",
  "address",
  "household_members",
];

export default function ReviewPage() {
  const { profile, reviewed, signature } = useAppState();
  const answers = profile.answers;
  const { showToast } = useToast();
  const groupQuestions = [
    ...new Set(
      [
        ...SUMMARY_FIELDS,
        ...FORM_INDEX.flatMap(
          (f) => getFormDef(f.id)?.fields.map((fl) => fl.group) ?? [],
        ),
      ]
        .map((id) => getGroup(id)?.question)
        .filter(Boolean) as string[],
    ),
  ];
  const t = useT([
    "Review and download",
    "Your summary",
    "Documents to bring",
    "Still missing",
    "Your forms",
    "Download",
    "Open",
    "Print / Save as PDF",
    "Delete my information",
    "Signature",
    "Date",
    "What you may qualify for",
    "A county worker decides what you actually get.",
    "You may qualify",
    "Worth asking about",
    "Immediate help you may get now",
    "Because of:",
    "Apply to shelters",
    ...ELIGIBILITY_STRINGS,
    ...groupQuestions,
  ]);

  // Decision support: what they may qualify for, immediate-need flags, and a
  // document checklist derived from the answers (lib/eligibility.ts).
  const elig = assessEligibility(answers);
  const supportingDocs = elig.documents;

  // Missing fields across all forms.
  const missing: { formId: string; code: string; question: string }[] = [];
  for (const f of FORM_INDEX) {
    const def = getFormDef(f.id)!;
    const seen = new Set<string>();
    for (const field of def.fields) {
      if (seen.has(field.group)) continue;
      seen.add(field.group);
      if (fieldStatus(field, answers) === "missing") {
        missing.push({
          formId: f.id,
          code: f.code,
          question: getGroup(field.group)?.question ?? field.group,
        });
      }
    }
  }

  async function download(formId: string, code: string) {
    try {
      const blob = await fetchFilledDoc(formId, answers, "export");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${code.replace(/\s+/g, "")}-completed.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Could not prepare that document. Please try again.", "error");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-navy">{t("Review and download")}</h1>
        <Link href="/forms" className="no-print text-sm text-ink/50 hover:text-ink">
          ← Back
        </Link>
      </div>

      {/* Immediate need — surfaced first because it's time-sensitive. */}
      {elig.immediateNeed.active && (
        <section className="mb-8 rounded-2xl border border-red-300 bg-red-50 p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-red-900">
            <span aria-hidden>⏱</span> {t("Immediate help you may get now")}
          </h2>
          <p className="text-sm text-red-900">
            {t("Because of:")}{" "}
            {elig.immediateNeed.triggers.map((x) => t(x)).join(", ")}.
          </p>
          <p className="mt-2 text-sm font-medium text-red-900">
            {t(ELIGIBILITY_IMMEDIATE)}
          </p>
        </section>
      )}

      {/* Applicant summary */}
      <section className="mb-8 rounded-lg border border-line bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-navy">{t("Your summary")}</h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {SUMMARY_FIELDS.map((id) => (
            <div key={id}>
              <dt className="text-xs text-ink/55">
                {t(getGroup(id)?.question ?? id)}
              </dt>
              <dd className="text-sm text-ink">
                {answers[id] || "—"}
              </dd>
            </div>
          ))}
        </dl>
        {(signature || answers.sign_date) && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="text-xs text-ink/55">{t("Signature")}</div>
            {signature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signature} alt={t("Signature")} className="mt-1 h-16" />
            ) : (
              <div className="text-sm text-ink/40">— signed electronically —</div>
            )}
            <div className="mt-1 text-xs text-ink/55">
              {t("Date")}: {answers.sign_date}
            </div>
          </div>
        )}
      </section>

      {/* What you may qualify for */}
      <section className="mb-8 rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold">{t("What you may qualify for")}</h2>
        <p className="mb-4 text-xs text-neutral-500">
          {t("A county worker decides what you actually get.")}
        </p>
        <div className="space-y-4">
          {elig.programs.map((p) => (
            <div key={p.key}>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  aria-hidden
                  className={[
                    "inline-block h-2.5 w-2.5 rounded-full",
                    p.status === "likely" ? "bg-emerald-500" : "bg-amber-400",
                  ].join(" ")}
                />
                <span className="text-sm font-medium text-neutral-900">{t(p.label)}</span>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs",
                    p.status === "likely"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800",
                  ].join(" ")}
                >
                  {p.status === "likely" ? t("You may qualify") : t("Worth asking about")}
                </span>
              </div>
              <ul className="mt-1.5 list-disc space-y-1 pl-6 text-sm text-neutral-600">
                {p.reasons.map((r, i) => (
                  <li key={i}>{t(r)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Supporting documents */}
      <section className="mb-8 rounded-lg border border-line bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-navy">{t("Documents to bring")}</h2>
        <ul className="space-y-2">
          {supportingDocs.map((d) => (
            <li key={d} className="flex items-start gap-3 text-sm text-ink/80">
              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-neutral-400" />
              {d}
            </li>
          ))}
        </ul>
      </section>

      {/* Missing info */}
      {missing.length > 0 && (
        <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-3 text-lg font-semibold text-amber-900">
            {t("Still missing")} ({missing.length})
          </h2>
          <ul className="space-y-1.5 text-sm text-amber-900">
            {missing.slice(0, 12).map((m, i) => (
              <li key={i}>
                <Link href={`/chat?form=${m.formId}`} className="hover:underline">
                  <span className="font-medium">{m.code}:</span> {t(m.question)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Forms + downloads */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-navy">{t("Your forms")}</h2>
        <div className="space-y-3">
          {FORM_INDEX.map((f) => {
            const def = getFormDef(f.id)!;
            const status = formStatus(def, answers, reviewed.includes(f.id));
            return (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white p-4"
              >
                <div className="min-w-0">
                  <div className="text-xs text-ink/55">{f.code}</div>
                  <div className="truncate text-sm font-medium text-ink">{f.title}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={status} />
                  <Link
                    href={`/forms/${f.id}`}
                    className="no-print rounded-md border border-line px-3 py-1.5 text-xs text-ink hover:bg-neutral-100"
                  >
                    {t("Open")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => download(f.id, f.code)}
                    className="no-print rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                  >
                    {t("Download")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md border border-line bg-white px-5 py-3 text-sm font-bold text-navy hover:bg-neutral-100"
          >
            {t("Print / Save as PDF")}
          </button>
          <Link
            href="/choose-shelters"
            className="rounded-md bg-brand px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark"
          >
            {t("Apply to shelters")}
          </Link>
        </div>
        <DeleteButton label={t("Delete my information")} />
      </div>
    </main>
  );
}
