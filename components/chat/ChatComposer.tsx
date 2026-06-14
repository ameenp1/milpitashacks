"use client";
import { useEffect, useRef, useState } from "react";
import { VoiceButton } from "@/components/VoiceButton";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import type { ChatComposerProps } from "@/lib/chat/contracts";

// Role 2 (Voice): mic-first composer. The microphone is the big primary control;
// typing is secondary. After the assistant finishes speaking, the mic auto-starts.
export function ChatComposer({
  currentGroup,
  sending,
  language,
  speaking,
  hearMode,
  t,
  onSubmit,
  onSkip,
  onStartRecording,
}: ChatComposerProps) {
  const isSsn = currentGroup?.answerType === "ssn";
  const [input, setInput] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [showText, setShowText] = useState(false);
  const [startSignal, setStartSignal] = useState(0);

  // Reset per question; SSN is easier to type, so show the masked field for it.
  useEffect(() => {
    setShowText(isSsn);
    setInput("");
    setShowSecret(false);
  }, [currentGroup?.id, isSsn]);

  // Auto-listen: on the assistant's "finished speaking" edge, start the mic —
  // only in voice mode, with a question pending, not mid-send, and when the user
  // hasn't chosen to type.
  const prevSpeaking = useRef(speaking);
  useEffect(() => {
    if (
      prevSpeaking.current &&
      !speaking &&
      hearMode &&
      currentGroup &&
      !sending &&
      !showText
    ) {
      setStartSignal((n) => n + 1);
    }
    prevSpeaking.current = speaking;
  }, [speaking, hearMode, currentGroup, sending, showText]);

  function send(text: string) {
    if (!text.trim() || sending || !currentGroup) return;
    onSubmit(text);
    setInput("");
  }

  return (
    <div className="border-t border-neutral-100 p-3">
      {currentGroup?.choices && (
        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {currentGroup.choices.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => send(c)}
              disabled={sending}
              className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:border-neutral-900 disabled:opacity-50"
            >
              {t(c)}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <VoiceButton
          big
          startSignal={startSignal}
          onResult={send}
          onRecordStart={onStartRecording}
          language={language}
        />
        {currentGroup && (
          <button
            type="button"
            onClick={() => setShowText((s) => !s)}
            className="text-xs text-neutral-400 hover:text-neutral-700"
          >
            {showText ? t("Hide typing") : t("Type instead")}
          </button>
        )}
      </div>

      {showText && (
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              type={isSsn && !showSecret ? "password" : "text"}
              placeholder={t("Type your answer…")}
              disabled={!currentGroup || sending}
              className="w-full rounded-lg border border-line px-4 py-3 pr-10 outline-none focus:border-brand disabled:bg-neutral-50"
            />
            {isSsn && (
              <button
                type="button"
                onClick={() => setShowSecret((s) => !s)}
                aria-label={showSecret ? "Hide" : "Show"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-navy"
              >
                {showSecret ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => send(input)}
            disabled={!input.trim() || sending || !currentGroup}
            className="rounded-lg bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {t("Send")}
          </button>
        </div>
      )}

      {currentGroup && (
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-neutral-400 hover:text-neutral-700"
          >
            {t("Skip")}
          </button>
        </div>
      )}
    </div>
  );
}
