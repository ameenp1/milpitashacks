"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setLanguage } from "@/lib/profile";
import { useSpeak } from "@/lib/client/useSpeak";
import { VoiceButton } from "@/components/VoiceButton";
import { SpeakerIcon } from "@/components/icons";

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
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">
          What language do you prefer?
        </h1>
        <button
          type="button"
          onClick={() => speak("What language do you prefer?")}
          className="rounded-full border border-line p-2 text-ink/70 hover:bg-brand-tint hover:text-brand"
          aria-label="Hear this"
        >
          <SpeakerIcon className="h-5 w-5" />
        </button>
      </div>
      <p className="mb-8 text-ink/70">
        Choose your language, or tap the microphone and say it.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => choose(l.code, l.native)}
            className="rounded border border-line bg-white px-5 py-5 text-left transition hover:border-brand hover:shadow-md"
          >
            <div className="text-xl font-bold text-navy">
              {l.native}
            </div>
            <div className="text-sm text-ink/60">{l.english}</div>
          </button>
        ))}
      </div>

      <div className="mt-10">
        <VoiceButton onResult={fromVoice} idleLabel="Say your language" />
      </div>
    </main>
  );
}
