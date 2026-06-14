"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setLanguage } from "@/lib/profile";
import { useSpeak } from "@/lib/client/useSpeak";
import { VoiceButton } from "@/components/VoiceButton";
import { BrandLogo } from "@/components/BrandLogo";

const LANGUAGES = [
  { code: "en", native: "English", english: "English" },
  { code: "es", native: "Español", english: "Spanish" },
  { code: "vi", native: "Tiếng Việt", english: "Vietnamese" },
  { code: "zh", native: "中文", english: "Chinese" },
  { code: "tl", native: "Tagalog", english: "Tagalog" },
  { code: "ko", native: "한국어", english: "Korean" },
  { code: "ar", native: "العربية", english: "Arabic" },
  { code: "ru", native: "Русский", english: "Russian" },
];

export default function LanguagePage() {
  const router = useRouter();
  const { speak } = useSpeak();

  useEffect(() => {
    speak("What language do you prefer?");
  }, [speak]);

  function choose(code: string, native: string) {
    setLanguage(code, native);
    router.push("/sign");
  }

  function fromVoice(transcript: string) {
    const said = transcript.toLowerCase();
    const match = LANGUAGES.find(
      (l) =>
        said.includes(l.english.toLowerCase()) ||
        said.includes(l.native.toLowerCase()),
    );
    if (match) choose(match.code, match.native);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <div className="mb-8 flex justify-end">
        <BrandLogo compact />
      </div>
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-3xl font-semibold sm:text-4xl">
          What language do you prefer?
        </h1>
        <button
          type="button"
          onClick={() => speak("What language do you prefer?")}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
          aria-label="Hear this"
        >
          🔊
        </button>
      </div>
      <p className="mb-8 text-neutral-500">
        Choose your language, or tap the microphone and say it.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => choose(l.code, l.native)}
            className="rounded-xl border border-neutral-300 px-5 py-5 text-left transition hover:border-neutral-900"
          >
            <div className="text-xl font-medium text-neutral-900">
              {l.native}
            </div>
            <div className="text-sm text-neutral-500">{l.english}</div>
          </button>
        ))}
      </div>

      <div className="mt-10">
        <VoiceButton onResult={fromVoice} idleLabel="Say your language" />
      </div>
    </main>
  );
}
