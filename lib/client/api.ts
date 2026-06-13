// Client-side wrappers around the API routes. NoKeyError lets the UI fall back
// to text input / English when no OpenAI key is configured.
"use client";

import type { ChatResult } from "@/lib/chat/contracts";

export class NoKeyError extends Error {
  constructor() {
    super("no_key");
    this.name = "NoKeyError";
  }
}

export async function transcribeAudio(
  blob: Blob,
  language?: string,
): Promise<string> {
  const fd = new FormData();
  fd.append("audio", blob, "speech");
  if (language) fd.append("language", language);
  const res = await fetch("/api/transcribe", { method: "POST", body: fd });
  if (res.status === 503) throw new NoKeyError();
  if (!res.ok) throw new Error("Transcription failed");
  const json = (await res.json()) as { text?: string };
  return json.text ?? "";
}

export async function chat(args: {
  message: string;
  question: string;
  answerType: string;
  choices?: string[];
  help?: string;
  language?: string;
}): Promise<ChatResult> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (res.status === 503) throw new NoKeyError();
  if (!res.ok) throw new Error("Chat failed");
  return (await res.json()) as ChatResult;
}

export async function askAssistant(
  messages: { role: "user" | "assistant"; content: string }[],
  language?: string,
  image?: string,
): Promise<string> {
  const res = await fetch("/api/assist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, language, image }),
  });
  if (res.status === 503) throw new NoKeyError();
  if (!res.ok) throw new Error("Assistant failed");
  const json = (await res.json()) as { reply?: string };
  return json.reply ?? "";
}

export interface ReviewPass {
  fixes: Record<string, string>;
  issues: { group: string; reason: string }[];
}

export async function reviewPass(
  items: { group: string; question: string; answerType: string; value: string }[],
): Promise<ReviewPass> {
  const res = await fetch("/api/review-pass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (res.status === 503) throw new NoKeyError();
  if (!res.ok) throw new Error("Review failed");
  return (await res.json()) as ReviewPass;
}

export async function translateBatch(
  texts: string[],
  target: string,
): Promise<string[]> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, target }),
  });
  if (!res.ok) return texts; // soft-fail to English
  const json = (await res.json()) as { translations?: string[] };
  return json.translations ?? texts;
}

export async function fetchTts(text: string, voice?: string): Promise<Blob> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });
  if (res.status === 503) throw new NoKeyError();
  if (!res.ok) throw new Error("Audio failed");
  return res.blob();
}

export async function fetchFilledDoc(
  formId: string,
  answers: Record<string, string>,
  mode: "preview" | "export" | "clean",
): Promise<Blob> {
  const res = await fetch("/api/fill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formId, answers, mode }),
  });
  if (!res.ok) throw new Error("Could not generate the document");
  return res.blob();
}
