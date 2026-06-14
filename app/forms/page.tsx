"use client";
import Link from "next/link";
import { FORM_INDEX, getFormDef } from "@/lib/data";
import { useAppState } from "@/lib/profile";
import { formStatus, formProgress } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteButton } from "@/components/DeleteButton";
import { useT } from "@/components/I18nProvider";

export default function FormsPage() {
  const { profile, reviewed } = useAppState();
  const answers = profile.answers;

  const t = useT([
    "Your forms",
    "We filled in what we could from your answers. Open each form to review it side by side.",
    "Review and download everything",
    "Apply online with a guide",
    "Delete my information",
    ...FORM_INDEX.map((f) => f.description),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">{t("Your forms")}</h1>
          <p className="mt-2 max-w-xl text-ink/60">
            {t(
              "We filled in what we could from your answers. Open each form to review it side by side.",
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {FORM_INDEX.map((f) => {
          const def = getFormDef(f.id)!;
          const status = formStatus(def, answers, reviewed.includes(f.id));
          const prog = formProgress(def, answers);
          return (
            <Link
              key={f.id}
              href={`/chat?form=${f.id}`}
              className="block rounded-lg border border-line bg-white p-5 transition hover:border-brand hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand">
                    {f.code}
                  </div>
                  <div className="text-lg font-bold text-navy">
                    {f.title}
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>
              <p className="mt-1 text-sm text-ink/60">{t(f.description)}</p>
              <div className="mt-3 text-xs text-ink/55">
                {prog.filled} of {prog.total} fields filled
                {prog.needsReview > 0 && ` · ${prog.needsReview} to review`}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/review"
            className="rounded-md bg-brand px-6 py-4 text-lg font-semibold text-white transition hover:bg-brand-dark"
          >
            {t("Review and download everything")}
          </Link>
          <Link
            href="/apply"
            className="rounded-md border border-brand/30 bg-white px-6 py-4 text-lg font-semibold text-brand transition hover:border-brand"
          >
            {t("Apply online with a guide")}
          </Link>
        </div>
        <DeleteButton label={t("Delete my information")} />
      </div>
    </main>
  );
}
