"use client";
import { useState } from "react";
import { VoiceButton } from "@/components/VoiceButton";

// Composer for the BenefitsCal guide chat: type a question or tap the mic. Kept
// separate from the form-filling ChatComposer, which is tied to the question
// queue (choices / SSN / skip) that doesn't apply to free-form help.
export function AssistComposer({
  sending,
  language,
  t,
  onSubmit,
}: {
  sending: boolean;
  language: string;
  t: (s: string) => string;
  onSubmit: (text: string) => void;
}) {
  const [input, setInput] = useState("");

  function send(text: string) {
    if (!text.trim() || sending) return;
    onSubmit(text);
    setInput("");
  }

  return (
    <div className="border-t border-neutral-100 p-3">
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder={t("Type your question…")}
          disabled={sending}
          className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900 disabled:bg-neutral-50"
        />
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
