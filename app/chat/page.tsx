"use client";
// Thin shell (Role 4): wires the flow hook to the three panels. Keep logic OUT
// of here — it belongs in useChatFlow or the panels (see PLAN.md / ROLES.md).
import Link from "next/link";
import { useChatFlow } from "@/lib/chat/useChatFlow";
import { ChatTranscript } from "@/components/chat/ChatTranscript";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { DocumentPanel } from "@/components/chat/DocumentPanel";
import { SpeakerIcon, SpeakerOffIcon } from "@/components/icons";
import { BrandLogo } from "@/components/BrandLogo";

const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

export default function ChatPage() {
  const flow = useChatFlow();
  const { t } = flow;

  return (
    <main className="mx-auto h-screen max-w-6xl px-4 py-4">
      <header className="no-print mb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo compact className="text-navy" />
          <Link href="/forms" className="text-sm text-ink/55 hover:text-ink">
            ← {t("All forms")}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/45">
            {flow.answeredCount} {t("answered")}
          </span>
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
          <Link
            href="/review"
            className="rounded-full bg-brand px-3 py-1 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {t("Review & download")}
          </Link>
        </div>
      </header>

      <div className="grid h-[calc(100vh-5rem)] gap-6 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col rounded-lg border border-line bg-white">
          <ChatTranscript
            messages={flow.messages}
            sending={flow.sending}
            hearMode={flow.hearMode}
            voice={flow.voice}
            speak={flow.speak}
            playingText={flow.playingText}
          />
          <ChatComposer
            currentGroup={flow.currentGroup}
            sending={flow.sending}
            language={flow.lang}
            speaking={flow.speaking}
            hearMode={flow.hearMode}
            t={t}
            onSubmit={flow.submit}
            onSkip={flow.skip}
            onStartRecording={flow.stop}
          />
        </section>

        <DocumentPanel
          activeForm={flow.activeForm}
          answers={flow.answers}
          activeValue={flow.lastValue}
          t={t}
          onSwitchForm={flow.setActiveForm}
          onEditField={flow.editField}
          lang={flow.lang}
          langLabel={flow.langLabel}
          done={!flow.currentGroup}
        />
      </div>
    </main>
  );
}
