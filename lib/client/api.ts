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

// Generated-doc cache, keyed by form+mode+language and holding the latest
// answers state only (one entry per key — old answer states are never revisited).
// It survives client-side navigation (module scope), so a copy warmed on /chat is
// reused instantly on /print and when toggling language — no re-translation wait.
type DocEntry = { answersKey: string; blob?: Blob; inflight?: Promise<Blob> };
const docCache = new Map<string, DocEntry>();
const docKey = (formId: string, mode: string, lang?: string) =>
  `${formId}|${mode}|${lang ?? "en"}`;
const answersKey = (a: Record<string, string>) =>
  JSON.stringify(Object.keys(a).sort().map((k) => [k, a[k]]));

export async function fetchFilledDoc(
  formId: string,
  answers: Record<string, string>,
  mode: "preview" | "export" | "clean",
  lang?: string,
): Promise<Blob> {
  const key = docKey(formId, mode, lang);
  const ak = answersKey(answers);
  const hit = docCache.get(key);
  if (hit && hit.answersKey === ak) {
    if (hit.blob) return hit.blob;
    if (hit.inflight) return hit.inflight;
  }
  const inflight = (async () => {
    const res = await fetch("/api/fill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId, answers, mode, lang }),
    });
    if (!res.ok) throw new Error("Could not generate the document");
    const blob = await res.blob();
    const e = docCache.get(key);
    if (e && e.answersKey === ak) {
      e.blob = blob;
      e.inflight = undefined;
    }
    return blob;
  })();
  docCache.set(key, { answersKey: ak, inflight });
  return inflight;
}

// Fire-and-forget: pre-generate a copy into the cache so a later view/print of
// the same answers is instant. Errors are ignored (it's only a warm-up).
export function warmFilledDoc(
  formId: string,
  answers: Record<string, string>,
  mode: "preview" | "export" | "clean",
  lang?: string,
): void {
  fetchFilledDoc(formId, answers, mode, lang).catch(() => {});
}
