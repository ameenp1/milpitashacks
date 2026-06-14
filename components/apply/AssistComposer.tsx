"use client";
import { useState } from "react";
import { VoiceButton } from "@/components/VoiceButton";
import { useScreenShare } from "@/lib/apply/useScreenShare";

// Composer for the BenefitsCal guide chat: type a question or tap the mic. Kept
// separate from the form-filling ChatComposer, which is tied to the question
// queue (choices / SSN / skip) that doesn't apply to free-form help. The screen
// button lets the user show the agent their page; while sharing, every question
// carries a fresh screenshot so the agent can see what they're looking at.
export function AssistComposer({
  sending,
  language,
  t,
  onSubmit,
}: {
  sending: boolean;
  language: string;
  t: (s: string) => string;
  onSubmit: (text: string, image?: string, mode?: string) => void;
}) {
  const [input, setInput] = useState("");
  const { sharing, start, stop, captureFrame } = useScreenShare();

  async function send(text: string) {
    if (!text.trim() || sending) return;
    const image = sharing ? (await captureFrame()) ?? undefined : undefined;
    onSubmit(text, image);
    setInput("");
  }

  // Vision autofill: grab the current screen and ask the agent what to type in the
  // field shown, using the saved profile. Starts sharing first (within this click
  // gesture, which getDisplayMedia requires) if it isn't already on.
  async function autofill() {
    if (sending) return;
    const ok = sharing || (await start());
    if (!ok) return;
    const image = (await captureFrame()) ?? undefined;
    onSubmit(t("What do I type here?"), image, "autofill");
  }

  return (
    <div className="border-t border-neutral-100 p-3">
      <button
        type="button"
        onClick={autofill}
        disabled={sending}
        title={t("What do I type here?")}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
      >
        ✨ {t("What do I type here?")}
      </button>
      {sharing && (
        <div className="mb-2 flex items-center justify-center gap-1.5 text-xs text-emerald-600">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {t("Agent can see your screen")}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder={t("Type your question…")}
          disabled={sending}
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900 disabled:bg-neutral-50"
        />
        <button
          type="button"
          onClick={() => (sharing ? stop() : start())}
          title={sharing ? t("Stop sharing") : t("Show agent my screen")}
          aria-pressed={sharing}
          className={[
            "rounded-xl border px-3 py-3 text-lg transition",
            sharing
              ? "border-emerald-500 bg-emerald-50 text-emerald-600"
              : "border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900",
          ].join(" ")}
        >
          🖥
        </button>
        <VoiceButton onResult={send} language={language} idleLabel={t("Ask a question")} />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={!input.trim() || sending}
          className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {t("Send")}
        </button>
      </div>
    </div>
  );
}
