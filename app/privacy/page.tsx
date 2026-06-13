"use client";
import Link from "next/link";
import { DeleteButton } from "@/components/DeleteButton";
import { useT } from "@/components/I18nProvider";

const POINTS = [
  "Your answers are stored only on this device, in your browser. We do not save them on a server or in any database.",
  "When you use voice or translation, the audio or text is sent to OpenAI to be processed, and is not stored by this app.",
  "Generating a form sends your answers to build the document and returns it to you — nothing is kept.",
  "You can delete everything from this device at any time with the button below.",
];

export default function PrivacyPage() {
  const t = useT([
    "Your privacy",
    "How your information is handled",
    "Delete my information",
    "Back",
    ...POINTS,
  ]);
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <Link href="/chat" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← {t("Back")}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">{t("Your privacy")}</h1>
      <p className="mt-2 text-neutral-500">{t("How your information is handled")}</p>
      <ul className="mt-8 space-y-4">
        {POINTS.map((p) => (
          <li key={p} className="flex items-start gap-3 text-neutral-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />
            <span className="leading-relaxed">{t(p)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <DeleteButton label={t("Delete my information")} />
      </div>
    </main>
  );
}
