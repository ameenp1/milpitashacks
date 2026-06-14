"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignaturePad } from "@/components/SignaturePad";
import { useAppState, setSignature, setAnswer } from "@/lib/profile";
import { todayMMDDYYYY } from "@/lib/date";
import { useT } from "@/components/I18nProvider";

export default function SignPage() {
  const router = useRouter();
  const { signature } = useAppState();
  const [sig, setSig] = useState<string | undefined>(signature);
  const t = useT([
    "Add your signature",
    "We'll add today's date for you automatically.",
    "Save and continue",
    "Skip for now",
  ]);

  function finish(save: boolean) {
    if (save && sig) {
      setSignature(sig);
      setAnswer("signature", sig); // travels with answers → embedded by the fill engine
    }
    setAnswer("sign_date", todayMMDDYYYY()); // auto date
    router.push("/chat");
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-bold text-navy">{t("Add your signature")}</h1>
      <p className="mt-2 text-ink/60">
        {t("We'll add today's date for you automatically.")} ({todayMMDDYYYY()})
      </p>
      <div className="mt-6">
        <SignaturePad initial={signature} onChange={setSig} />
      </div>
      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => finish(true)}
          className="rounded-md bg-brand px-8 py-4 text-lg font-semibold text-white transition hover:bg-brand-dark"
        >
          {t("Save and continue")}
        </button>
        <button
          type="button"
          onClick={() => finish(false)}
          className="text-sm text-ink/50 hover:text-ink"
        >
          {t("Skip for now")}
        </button>
      </div>
    </main>
  );
}
