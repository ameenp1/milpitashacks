"use client";
// Free-form chat that guides the user through the BenefitsCal online application
// (rendered beside it). Unlike useChatFlow, there is no fixed question queue —
// the user asks whatever they want and the assistant answers from context_docs
// (via /api/assist). Reuses the same voice infra (useSpeak + ChatTranscript).
import { useEffect, useRef, useState } from "react";
import { askAssistant, NoKeyError } from "@/lib/client/api";
import { useSpeak } from "@/lib/client/useSpeak";
import { useI18n } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import type { Msg } from "@/lib/chat/contracts";

const INTRO =
  "Hi. The benefits application is open on the right. I'll guide you through it step by step — go ahead and start, and ask me anything along the way, like what a question means or which documents you'll need.";
const ERROR = "Something went wrong. Please try again.";
const NO_KEY =
  "The assistant needs an OpenAI API key to answer. You can still work through the application on the right.";

export const APPLY_CHROME = [
  "Step-by-step help",
  "Sound on",
  "Sound off",
  "Type your question…",
  "Send",
  "Ask a question",
  "All forms",
  "Reload",
  "Open in new tab",
  "Show agent my screen",
  "Stop sharing",
  "Agent can see your screen",
  "Couldn't capture your screen. Try sharing again.",
  INTRO,
  ERROR,
  NO_KEY,
];

export function useAssistChat() {
  const { t, ensure, langLabel, lang } = useI18n();
  const { speak, stop, speaking, playingText } = useSpeak();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const [hearMode, setHearMode] = useState(false);
  const [voice, setVoice] = useState("alloy");
  const idRef = useRef(1);
  const introducedRef = useRef(false);

  useEffect(() => {
    ensure(APPLY_CHROME);
  }, [ensure]);

  // Greet once the intro is translated (English is ready immediately).
  useEffect(() => {
    if (introducedRef.current) return;
    introducedRef.current = true;
    setMessages([{ id: idRef.current++, role: "bot", text: t(INTRO), speak: hearMode }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  async function send(message: string, image?: string) {
    const text = message.trim();
    if (!text || sending) return;
    stop();

    const userMsg: Msg = { id: idRef.current++, role: "user", text, image };
    const history = [...messages, userMsg];
    setMessages(history);
    setSending(true);

    try {
      const reply = await askAssistant(
        history.map((m) => ({
          role: m.role === "bot" ? ("assistant" as const) : ("user" as const),
          content: m.text,
        })),
        langLabel,
        image,
      );
      setMessages((m) => [
        ...m,
        { id: idRef.current++, role: "bot", text: reply || t(ERROR), speak: hearMode },
      ]);
    } catch (err) {
      showToast(err instanceof NoKeyError ? t(NO_KEY) : t(ERROR), "error");
    } finally {
      setSending(false);
    }
  }

  return {
    messages,
    sending,
    hearMode,
    setHearMode,
    voice,
    setVoice,
    speak,
    stop,
    speaking,
    playingText,
    send,
    t,
    langLabel,
    lang,
  };
}
