"use client";
import { useRef, useState } from "react";
import { transcribeAudio, NoKeyError } from "@/lib/client/api";
import { useToast } from "./Toast";

type State = "idle" | "recording" | "processing";

export function VoiceButton({
  onResult,
  language,
  idleLabel = "Tap to speak",
}: {
  onResult: (text: string) => void;
  language?: string;
  idleLabel?: string;
}) {
  const [state, setState] = useState<State>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { showToast } = useToast();

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setState("processing");
        try {
          const text = await transcribeAudio(blob, language);
          if (text.trim()) onResult(text.trim());
          else showToast("I didn't catch that. Please try again.", "info");
        } catch (err) {
          if (err instanceof NoKeyError) {
            showToast("Voice isn't set up yet — you can type instead.", "info");
          } else {
            showToast("Could not hear that. Try again or type your answer.", "error");
          }
        } finally {
          setState("idle");
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setState("recording");
    } catch {
      showToast("Please allow microphone access, or type your answer.", "error");
      setState("idle");
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  return (
    <button
      type="button"
      onClick={() => (state === "recording" ? stop() : state === "idle" ? start() : undefined)}
      disabled={state === "processing"}
      aria-pressed={state === "recording"}
      className={[
        "inline-flex items-center gap-3 rounded-full px-7 py-4 text-lg font-medium transition",
        state === "recording"
          ? "bg-red-600 text-white hover:bg-red-700"
          : state === "processing"
            ? "bg-neutral-200 text-neutral-500"
            : "bg-neutral-900 text-white hover:bg-neutral-700",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-3 w-3 rounded-full",
          state === "recording" ? "animate-pulse bg-white" : "bg-white/80",
        ].join(" ")}
        aria-hidden
      />
      {state === "recording"
        ? "Listening… tap to stop"
        : state === "processing"
          ? "One moment…"
          : idleLabel}
    </button>
  );
}
