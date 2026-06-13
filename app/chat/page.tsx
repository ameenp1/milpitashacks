"use client";
// Thin shell (Role 4): wires the flow hook to the three panels. Keep logic OUT
// of here — it belongs in useChatFlow or the panels (see PLAN.md / ROLES.md).
import Link from "next/link";
import { useChatFlow } from "@/lib/chat/useChatFlow";
import { ChatTranscript } from "@/components/chat/ChatTranscript";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { DocumentPanel } from "@/components/chat/DocumentPanel";

const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

export default function ChatPage() {
  const flow = useChatFlow();
  const { t } = flow;

  return (
    <main className="mx-auto h-screen max-w-6xl px-4 py-4">
      <header className="no-print mb-3 flex items-center justify-between">
        <Link href="/forms" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← {t("All forms")}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            {flow.answeredCount} {t("answered")}
          </span>
          <button
            type="button"
            onClick={() => {
              if (flow.hearMode) flow.stop();
              flow.setHearMode(!flow.hearMode);
            }}
            className="rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            {flow.hearMode ? `🔊 ${t("Sound on")}` : `🔇 ${t("Sound off")}`}
          </button>
          {flow.hearMode && (
            <select
              value={flow.voice}
              onChange={(e) => flow.setVoice(e.target.value)}
              aria-label="Voice"
              className="rounded-full border border-neutral-200 px-2 py-1 text-sm text-neutral-600"
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
            className="rounded-full bg-neutral-900 px-3 py-1 text-sm font-medium text-white hover:bg-neutral-700"
          >
            {t("Review & download")}
          </Link>
        </div>
      </header>

      <div className="grid h-[calc(100vh-5rem)] gap-6 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col rounded-2xl border border-neutral-200">
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
          />
        </section>

        <DocumentPanel
          activeForm={flow.activeForm}
          answers={flow.answers}
          activeValue={flow.lastValue}
          t={t}
          onSwitchForm={flow.setActiveForm}
          onEditField={flow.editField}
        />
      </div>
    </main>
  );
}
