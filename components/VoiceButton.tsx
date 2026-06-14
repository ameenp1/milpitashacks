"use client";
import { useEffect, useRef, useState } from "react";
import { transcribeAudio, NoKeyError } from "@/lib/client/api";
import { useToast } from "./Toast";
import { MicIcon } from "./icons";

type State = "idle" | "recording" | "processing";

export function VoiceButton({
  onResult,
  language,
  idleLabel = "Tap to speak",
  big = false,
  startSignal,
  onRecordStart,
}: {
  onResult: (text: string) => void;
  language?: string;
  idleLabel?: string;
  big?: boolean; // large primary mic (mic-first composer)
  startSignal?: number; // bump to auto-start recording (after the bot speaks)
  onRecordStart?: () => void; // fired when recording begins (e.g. to cut TTS)
}) {
  const [state, setState] = useState<State>("idle");
  const stateRef = useRef<State>("idle");
  stateRef.current = state;
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { showToast } = useToast();

  // Always deliver to the CURRENT handler/language. A recording may have started
  // for an earlier question (mic-first auto-listen) and only finish after the user
  // moved on (e.g. skipped); its result must go to whatever question is current
  // now, not the one captured when recording began.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const languageRef = useRef(language);
  languageRef.current = language;
  // Bumped whenever we (re)start; an abandoned recording's result is discarded.
  const epochRef = useRef(0);

  async function start() {
    if (stateRef.current === "processing") return; // don't cut off transcription
    // Abandon any recording still running from a previous question (the user
    // skipped/advanced while the mic was open), then listen fresh.
    epochRef.current += 1;
    const epoch = epochRef.current;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        /* already stopping */
      }
    }
    recorderRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (epoch !== epochRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return; // superseded while acquiring the mic
      }
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (epoch !== epochRef.current) return; // abandoned -> discard this take
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setState("processing");
        try {
          const text = await transcribeAudio(blob, languageRef.current);
          if (epoch !== epochRef.current) return;
          if (text.trim()) onResultRef.current(text.trim());
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
      onRecordStart?.(); // user is talking → cut any assistant audio (barge-in)
    } catch {
      showToast("Please allow microphone access, or type your answer.", "error");
      setState("idle");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  // Auto-start when the parent bumps startSignal (after the assistant speaks).
  const prevSignal = useRef(startSignal);
  useEffect(() => {
    if (startSignal !== undefined && startSignal !== prevSignal.current) {
      prevSignal.current = startSignal;
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSignal]);

  const toggle = () =>
    state === "recording" ? stopRecording() : state === "idle" ? start() : undefined;

  if (big) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={state === "processing"}
        aria-pressed={state === "recording"}
        aria-label={state === "recording" ? "Stop" : "Speak"}
        className={[
          "flex h-24 w-24 flex-col items-center justify-center rounded-full shadow-sm transition",
          state === "recording"
            ? "animate-pulse bg-red-600 text-white"
            : state === "processing"
              ? "bg-neutral-200 text-neutral-400"
              : "bg-brand text-white hover:bg-brand-dark",
        ].join(" ")}
      >
        {state === "processing" ? (
          <span className="text-3xl">…</span>
        ) : (
          <MicIcon className="h-7 w-7" />
        )}
        <span className="mt-1 text-[11px] font-medium">
          {state === "recording"
            ? "Tap to stop"
            : state === "processing"
              ? "One moment"
              : "Tap to speak"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={state === "processing"}
      aria-pressed={state === "recording"}
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition",
        state === "recording"
          ? "bg-red-600 text-white hover:bg-red-700"
          : state === "processing"
            ? "bg-neutral-200 text-neutral-500"
            : "bg-brand text-white hover:bg-brand-dark",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-2.5 w-2.5 rounded-full",
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
