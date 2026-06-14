"use client";
import Link from "next/link";
import { FORM_INDEX, getFormDef } from "@/lib/data";
import { useAppState } from "@/lib/profile";
import { formStatus, formProgress } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import { DeleteButton } from "@/components/DeleteButton";
import { useT } from "@/components/I18nProvider";
import { BrandLogo } from "@/components/BrandLogo";

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
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t("Your forms")}</h1>
          <p className="mt-2 max-w-xl text-neutral-500">
            {t(
              "We filled in what we could from your answers. Open each form to review it side by side.",
            )}
          </p>
        </div>
        <BrandLogo compact className="shrink-0" />
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
              className="block rounded-2xl border border-neutral-200 p-5 transition hover:border-neutral-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium tracking-wide text-neutral-500">
                    {f.code}
                  </div>
                  <div className="text-lg font-medium text-neutral-900">
                    {f.title}
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>
              <p className="mt-1 text-sm text-neutral-500">{t(f.description)}</p>
              <div className="mt-3 text-xs text-neutral-500">
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
            className="rounded-xl bg-neutral-900 px-6 py-4 text-lg font-medium text-white hover:bg-neutral-700"
          >
            {t("Review and download everything")}
          </Link>
          <Link
            href="/apply"
            className="rounded-xl border border-neutral-300 px-6 py-4 text-lg font-medium text-neutral-700 hover:border-neutral-900 hover:text-neutral-900"
          >
            {t("Apply online with a guide")}
          </Link>
        </div>
        <DeleteButton label={t("Delete my information")} />
      </div>
    </main>
  );
}
