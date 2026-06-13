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
    ...groupQuestions,
  ]);

  const supportingDocs = [
    "Photo ID (driver's license, state ID, or passport)",
    "Social Security card or number for each person applying",
    "Proof of any income (pay stubs, award letters)",
    "Proof of your money/resources (recent bank statements)",
    answers["has_eviction_notice"] === "Yes"
      ? "Your 'pay rent or quit' (eviction) notice"
      : "",
    answers["has_home"] === "No"
      ? "Anything that shows where you have been staying, if you have it"
      : "",
  ].filter(Boolean);

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
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{t("Review and download")}</h1>
        <Link href="/forms" className="no-print text-sm text-neutral-500 hover:text-neutral-900">
          ← Back
        </Link>
      </div>

      {/* Applicant summary */}
      <section className="mb-8 rounded-2xl border border-neutral-200 p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("Your summary")}</h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {SUMMARY_FIELDS.map((id) => (
            <div key={id}>
              <dt className="text-xs text-neutral-500">
                {t(getGroup(id)?.question ?? id)}
              </dt>
              <dd className="text-sm text-neutral-900">
                {answers[id] || "—"}
              </dd>
            </div>
          ))}
        </dl>
        {(signature || answers.sign_date) && (
          <div className="mt-5 border-t border-neutral-100 pt-4">
            <div className="text-xs text-neutral-500">{t("Signature")}</div>
            {signature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signature} alt={t("Signature")} className="mt-1 h-16" />
            ) : (
              <div className="text-sm text-neutral-400">— signed electronically —</div>
            )}
            <div className="mt-1 text-xs text-neutral-500">
              {t("Date")}: {answers.sign_date}
            </div>
          </div>
        )}
      </section>

      {/* Supporting documents */}
      <section className="mb-8 rounded-2xl border border-neutral-200 p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("Documents to bring")}</h2>
        <ul className="space-y-2">
          {supportingDocs.map((d) => (
            <li key={d} className="flex items-start gap-3 text-sm text-neutral-700">
              <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-neutral-300" />
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
        <h2 className="mb-4 text-lg font-semibold">{t("Your forms")}</h2>
        <div className="space-y-3">
          {FORM_INDEX.map((f) => {
            const def = getFormDef(f.id)!;
            const status = formStatus(def, answers, reviewed.includes(f.id));
            return (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-4"
              >
                <div className="min-w-0">
                  <div className="text-xs text-neutral-500">{f.code}</div>
                  <div className="truncate text-sm font-medium">{f.title}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={status} />
                  <Link
                    href={`/forms/${f.id}`}
                    className="no-print rounded-lg border border-neutral-200 px-3 py-1.5 text-xs hover:bg-neutral-50"
                  >
                    {t("Open")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => download(f.id, f.code)}
                    className="no-print rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700"
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
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl border border-neutral-300 px-5 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          {t("Print / Save as PDF")}
        </button>
        <DeleteButton label={t("Delete my information")} />
      </div>
    </main>
  );
}
