"use client";
import { useCallback, useRef, useState } from "react";
import { fetchTts, NoKeyError } from "./api";

// Reads text aloud via OpenAI TTS. Silently no-ops if no key is configured or
// the browser blocks autoplay (a manual tap still works).
//
// Utterances are QUEUED, not interrupted: consecutive bot turns (e.g. "Thank
// you." then the next question) play back-to-back without cutting each other off.
// `stop()` flushes the queue + halts playback — used when the user takes an
// action (submit/skip) so we don't make them wait. `speaking` stays true while
// anything is playing or queued, and flips to false when the queue drains — that
// false-edge is the "finished talking" signal the composer uses to auto-listen.
export function useSpeak() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<{ text: string; voice?: string }[]>([]);
  const playingRef = useRef(false);
  const disabledRef = useRef(false);
  const [speaking, setSpeaking] = useState(false);
  // The text of the utterance that has actually begun PLAYING. The transcript
  // uses this to start a turn's typewriter only once its audio starts, so speech
  // leads the typing instead of arriving after it (revisions_2 L4).
  const [playingText, setPlayingText] = useState<string | null>(null);

  const stop = useCallback(() => {
    queueRef.current = [];
    playingRef.current = false;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
    setPlayingText(null);
  }, []);

  const playNext = useCallback(async () => {
    if (playingRef.current) return; // a turn is already playing
    const item = queueRef.current.shift();
    if (!item) {
      setSpeaking(false); // queue drained
      setPlayingText(null);
      return;
    }
    playingRef.current = true;
    setSpeaking(true);
    try {
      const blob = await fetchTts(item.text, item.voice);
      if (!playingRef.current) return; // stopped while fetching
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      const advance = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
        playingRef.current = false;
        playNext();
      };
      audio.onended = advance;
      audio.onerror = advance;
      await audio
        .play()
        .then(() => {
          if (audioRef.current === audio) setPlayingText(item.text);
        })
        .catch(advance);
    } catch (err) {
      if (err instanceof NoKeyError) {
        disabledRef.current = true;
        queueRef.current = [];
      }
      playingRef.current = false;
      playNext();
    }
  }, []);

  const speak = useCallback(
    (text: string, voice?: string) => {
      if (disabledRef.current || !text.trim()) return;
      queueRef.current.push({ text, voice });
      playNext();
    },
    [playNext],
  );

  return { speak, stop, speaking, playingText };
}
