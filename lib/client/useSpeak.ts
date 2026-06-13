"use client";
import { useCallback, useRef, useState } from "react";
import { fetchTts, NoKeyError } from "./api";

// Reads text aloud via OpenAI TTS. Silently no-ops if no key is configured or
// the browser blocks autoplay (a manual tap will still work).
export function useSpeak() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const disabledRef = useRef(false);
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string, voice?: string) => {
      if (disabledRef.current || !text.trim()) return;
      try {
        const blob = await fetchTts(text, voice);
        const url = URL.createObjectURL(blob);
        stop();
        const audio = new Audio(url);
        audioRef.current = audio;
        setSpeaking(true);
        audio.onended = () => {
          setSpeaking(false);
          URL.revokeObjectURL(url);
        };
        await audio.play().catch(() => setSpeaking(false));
      } catch (err) {
        if (err instanceof NoKeyError) disabledRef.current = true;
        setSpeaking(false);
      }
    },
    [stop],
  );

  return { speak, stop, speaking };
}
