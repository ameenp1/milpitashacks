"use client";
import { useEffect, useRef } from "react";
import { Typewriter } from "./Typewriter";
import type { ChatTranscriptProps } from "@/lib/chat/contracts";

// Role 2 (Voice) owns this: renders the conversation and reads new bot turns aloud.
export function ChatTranscript({
  messages,
  sending,
  hearMode,
  voice,
  speak,
}: ChatTranscriptProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastSpokenId = useRef(0);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Read new bot turns aloud as they appear (so audio starts with the typing).
  // Every new turn is enqueued in order, so a batched ack + next question play
  // back-to-back without cutting each other off (useSpeak queues). The pointer
  // advances even when muted so toggling sound on doesn't replay old turns.
  useEffect(() => {
    for (const m of messages) {
      if (m.id <= lastSpokenId.current) continue;
      lastSpokenId.current = m.id;
      if (m.role === "bot" && m.speak && hearMode) speak(m.text, voice);
    }
  }, [messages, hearMode, voice, speak]);

  return (
    <div ref={ref} className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
        >
          <div
            className={[
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
              m.role === "user"
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-900",
            ].join(" ")}
          >
            {m.role === "bot" ? <Typewriter text={m.text} /> : m.text}
          </div>
        </div>
      ))}
      {sending && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-neutral-100 px-4 py-2.5 text-neutral-400">…</div>
        </div>
      )}
    </div>
  );
}
