"use client";
// Side-by-side "apply online" mode: the step-by-step guide chat on the left,
// the live BenefitsCal application rendered on the right. Mirrors /chat's shell,
// but the right panel is a real website instead of the form preview.
import Link from "next/link";
import { useAssistChat } from "@/lib/apply/useAssistChat";
import { ChatTranscript } from "@/components/chat/ChatTranscript";
import { AssistComposer } from "@/components/apply/AssistComposer";
import { BrowserPanel } from "@/components/apply/BrowserPanel";
import { SpeakerIcon, SpeakerOffIcon } from "@/components/icons";
import { BrandLogo } from "@/components/BrandLogo";

const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

export default function ApplyPage() {
  const flow = useAssistChat();
  const { t } = flow;

  return (
    <main className="mx-auto h-screen max-w-7xl px-4 py-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo compact className="text-navy" />
          <Link href="/forms" className="text-sm text-ink/55 hover:text-ink">
            ← {t("All forms")}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink/45">{t("Step-by-step help")}</span>
          <button
            type="button"
            onClick={() => {
              if (flow.hearMode) flow.stop();
              flow.setHearMode(!flow.hearMode);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm text-ink/70 hover:bg-brand-tint"
          >
            {flow.hearMode ? (
              <SpeakerIcon className="h-4 w-4" />
            ) : (
              <SpeakerOffIcon className="h-4 w-4" />
            )}
            {flow.hearMode ? t("Sound on") : t("Sound off")}
          </button>
          {flow.hearMode && (
            <select
              value={flow.voice}
              onChange={(e) => flow.setVoice(e.target.value)}
              aria-label="Voice"
              className="rounded-full border border-line px-2 py-1 text-sm text-ink/70"
            >
              {VOICES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <div className="grid h-[calc(100vh-5rem)] gap-6 lg:grid-cols-[minmax(360px,2fr)_3fr]">
        <section className="flex min-h-0 flex-col rounded-lg border border-line bg-white">
          <ChatTranscript
            messages={flow.messages}
            sending={flow.sending}
            hearMode={flow.hearMode}
            voice={flow.voice}
            speak={flow.speak}
            playingText={flow.playingText}
          />
          <AssistComposer
            sending={flow.sending}
            language={flow.lang}
            t={t}
            onSubmit={flow.send}
          />
        </section>

        <BrowserPanel t={t} />
      </div>
    </main>
  );
}
