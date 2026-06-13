"use client";
import { useEffect, useRef, useState } from "react";
import { Typewriter } from "./Typewriter";
import type { ChatTranscriptProps } from "@/lib/chat/contracts";

// How long to wait for a spoken turn's audio before typing anyway, so the text
// never gets stuck if TTS is slow, blocked, or unavailable (no key).
const AUDIO_GRACE_MS = 4000;

// Role 2 (Voice) owns this: renders the conversation and reads new bot turns aloud.
export function ChatTranscript({
  messages,
  sending,
  hearMode,
  voice,
  speak,
  playingText,
}: ChatTranscriptProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastSpokenId = useRef(0);

  // Which bot turns may start typing. A spoken turn waits for its audio to begin
  // (so speech leads the typewriter, revisions_2 L4); everything else types now.
  const startedRef = useRef<Set<number>>(new Set());
  const [, force] = useState(0);
  const rerender = () => force((v) => v + 1);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Read new bot turns aloud as they appear. Every new turn is enqueued in order,
  // so a batched ack + next question play back-to-back without cutting each other
  // off (useSpeak queues). The pointer advances even when muted so toggling sound
  // on doesn't replay old turns.
  useEffect(() => {
    for (const m of messages) {
      if (m.id <= lastSpokenId.current) continue;
      lastSpokenId.current = m.id;
      if (m.role === "bot" && m.speak && hearMode) speak(m.text, voice);
    }
  }, [messages, hearMode, voice, speak]);

  // Turns that won't be spoken (user turns, or sound off) type immediately.
  useEffect(() => {
    let changed = false;
    for (const m of messages) {
      const willSpeak = m.role === "bot" && m.speak && hearMode;
      if (!willSpeak && !startedRef.current.has(m.id)) {
        startedRef.current.add(m.id);
        changed = true;
      }
    }
    if (changed) rerender();
  }, [messages, hearMode]);

  // When a spoken turn's audio begins, let that turn start typing.
  useEffect(() => {
    if (!playingText) return;
    const m = messages.find(
      (m) => m.role === "bot" && m.text === playingText && !startedRef.current.has(m.id),
    );
    if (m) {
      startedRef.current.add(m.id);
      rerender();
    }
  }, [playingText, messages]);

  // Fallback: never let a spoken turn stay hidden if its audio is slow/absent.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const m of messages) {
      if (m.role === "bot" && m.speak && hearMode && !startedRef.current.has(m.id)) {
        timers.push(
          setTimeout(() => {
            if (!startedRef.current.has(m.id)) {
              startedRef.current.add(m.id);
              rerender();
            }
          }, AUDIO_GRACE_MS),
        );
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [messages, hearMode]);

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
            {m.role === "bot" ? (
              <Typewriter text={m.text} start={startedRef.current.has(m.id)} />
            ) : (
              <>
                {m.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image}
                    alt="Screen you shared"
                    className="mb-2 block max-h-44 w-full rounded-lg border border-white/20 object-cover"
                  />
                )}
                {m.text}
              </>
            )}
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
