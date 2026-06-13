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
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold">{t("Add your signature")}</h1>
      <p className="mt-2 text-neutral-500">
        {t("We'll add today's date for you automatically.")} ({todayMMDDYYYY()})
      </p>
      <div className="mt-6">
        <SignaturePad initial={signature} onChange={setSig} />
      </div>
      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => finish(true)}
          className="rounded-xl bg-neutral-900 px-8 py-4 text-lg font-medium text-white hover:bg-neutral-700"
        >
          {t("Save and continue")}
        </button>
        <button
          type="button"
          onClick={() => finish(false)}
          className="text-sm text-neutral-400 hover:text-neutral-700"
        >
          {t("Skip for now")}
        </button>
      </div>
    </main>
  );
}
