"use client";
import { useEffect, useRef, useState } from "react";
import type { QuestionGroup } from "@/lib/types";
import { useT } from "./I18nProvider";
import { useToast } from "./Toast";
import { VoiceButton } from "./VoiceButton";
import { useSpeak } from "@/lib/client/useSpeak";
import { understand, NoKeyError } from "@/lib/client/api";

const STRUCTURED = new Set(["boolean", "choice", "date", "number", "money", "ssn"]);

export function QuestionCard({
  group,
  value,
  language,
  soundOn,
  onAnswer,
  onSkip,
  submitLabel = "Save and continue",
}: {
  group: QuestionGroup;
  value: string;
  language: string;
  soundOn: boolean;
  onAnswer: (value: string) => void;
  onSkip?: () => void;
  submitLabel?: string;
}) {
  const t = useT([
    group.question,
    group.help ?? "",
    submitLabel,
    "Skip for now",
    "Hear this",
    "Type your answer",
    ...(group.choices ?? []),
  ]);
  const { showToast } = useToast();
  const { speak } = useSpeak();
  const [text, setText] = useState(value);
  const [busy, setBusy] = useState(false);
  const spokeFor = useRef<string>("");

  useEffect(() => setText(value), [value, group.id]);

  const displayedQuestion = t(group.question);

  // Auto-read the question once per group when its translation is ready.
  useEffect(() => {
    if (!soundOn) return;
    const ready = language === "en" || displayedQuestion !== group.question;
    if (ready && spokeFor.current !== group.id) {
      spokeFor.current = group.id;
      speak(displayedQuestion);
    }
  }, [group.id, group.question, displayedQuestion, soundOn, language, speak]);

  const choices = group.choices;

  async function handleVoice(transcript: string) {
    if (!STRUCTURED.has(group.answerType)) {
      // Free text: use the transcript directly.
      setText(transcript);
      onAnswer(transcript);
      return;
    }
    setBusy(true);
    try {
      const r = await understand({
        question: group.question,
        answerType: group.answerType,
        choices,
        transcript,
        language,
      });
      if (r.needsClarification && r.clarification) {
        showToast(r.clarification, "info");
        if (soundOn) speak(r.clarification);
      } else if (r.value) {
        setText(r.value);
        onAnswer(r.value);
      }
    } catch (err) {
      if (err instanceof NoKeyError) {
        setText(transcript);
        onAnswer(transcript);
      } else {
        showToast("Could not process that. Please try again or type it.", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold leading-snug text-neutral-900">
          {displayedQuestion}
        </h2>
        <button
          type="button"
          onClick={() => speak(displayedQuestion)}
          className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
          aria-label={t("Hear this")}
        >
          🔊 {t("Hear this")}
        </button>
      </div>
      {group.help && (
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          {t(group.help)}
        </p>
      )}

      {choices ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {choices.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onAnswer(c)}
              className={[
                "rounded-xl border px-6 py-4 text-lg font-medium transition",
                value === c
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-800 hover:border-neutral-900",
              ].join(" ")}
            >
              {t(c)}
            </button>
          ))}
          <div className="w-full pt-2">
            <VoiceButton onResult={handleVoice} language={language} />
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {group.answerType === "longtext" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder={t("Type your answer")}
              className="w-full rounded-xl border border-neutral-300 p-4 text-lg outline-none focus:border-neutral-900"
            />
          ) : (
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              inputMode={
                group.answerType === "number" || group.answerType === "money"
                  ? "decimal"
                  : group.answerType === "phone"
                    ? "tel"
                    : "text"
              }
              placeholder={t("Type your answer")}
              className="w-full rounded-xl border border-neutral-300 p-4 text-lg outline-none focus:border-neutral-900"
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <VoiceButton onResult={handleVoice} language={language} />
            <button
              type="button"
              disabled={busy || !text.trim()}
              onClick={() => onAnswer(text.trim())}
              className="rounded-xl bg-neutral-900 px-6 py-4 text-lg font-medium text-white transition hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      )}

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-5 text-sm text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline"
        >
          {t("Skip for now")}
        </button>
      )}
    </div>
  );
}
