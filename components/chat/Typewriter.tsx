"use client";
import { useEffect, useState } from "react";

// Types text out character-by-character once, then stays. Keyed by message id by
// the caller, so re-renders don't restart it. `start` lets the caller hold the
// typing until the turn's audio begins, so speech leads the text (revisions_2 L4).
export function Typewriter({
  text,
  speed = 14,
  start = true,
}: {
  text: string;
  speed?: number;
  start?: boolean;
}) {
  const [n, setN] = useState(0);
  useEffect(() => setN(0), [text]);
  useEffect(() => {
    if (!start) return;
    if (n >= text.length) return;
    const id = setTimeout(() => setN((v) => v + 1), speed);
    return () => clearTimeout(id);
  }, [n, text, speed, start]);
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && (
        <span className="ml-0.5 inline-block animate-pulse">▋</span>
      )}
    </>
  );
}
