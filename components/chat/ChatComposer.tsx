"use client";
import { useState } from "react";
import { VoiceButton } from "@/components/VoiceButton";
import type { ChatComposerProps } from "@/lib/chat/contracts";

// Role 2 (Voice) owns this: text input + mic + (masked) SSN + choices + skip.
export function ChatComposer({
  currentGroup,
  sending,
  language,
  t,
  onSubmit,
  onSkip,
}: ChatComposerProps) {
  const [input, setInput] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const isSsn = currentGroup?.answerType === "ssn";

  function send(text: string) {
    if (!text.trim() || sending || !currentGroup) return;
    onSubmit(text);
    setInput("");
  }

  return (
    <div className="border-t border-neutral-100 p-3">
      {currentGroup?.choices && (
        <div className="mb-2 flex flex-wrap gap-2">
          {currentGroup.choices.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => send(c)}
              disabled={sending}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:border-neutral-900 disabled:opacity-50"
            >
              {t(c)}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            type={isSsn && !showSecret ? "password" : "text"}
            placeholder={t("Type your answer…")}
            disabled={!currentGroup || sending}
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 pr-10 outline-none focus:border-neutral-900 disabled:bg-neutral-50"
          />
          {isSsn && (
            <button
              type="button"
              onClick={() => setShowSecret((s) => !s)}
              aria-label={showSecret ? "Hide" : "Show"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            >
              {showSecret ? "🙈" : "👁"}
            </button>
          )}
        </div>
        <VoiceButton onResult={send} language={language} idleLabel="🎤" />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={!input.trim() || sending || !currentGroup}
          className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {t("Send")}
        </button>
      </div>
      {currentGroup && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-2 text-xs text-neutral-400 hover:text-neutral-700"
        >
          {t("Skip")}
        </button>
      )}
    </div>
  );
}
