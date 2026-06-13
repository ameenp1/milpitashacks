// Server-only OpenAI helpers. Routes that use these degrade gracefully to a 503
// when no key is configured, so the app stays usable (text input + English).
import OpenAI from "openai";

export class NoKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not set");
    this.name = "NoKeyError";
  }
}

export function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new NoKeyError();
  return new OpenAI({ apiKey });
}

export const MODELS = {
  transcribe: "gpt-4o-transcribe",
  chat: "gpt-4o",
  tts: "gpt-4o-mini-tts",
} as const;

// Shared error -> Response mapping for the routes.
import { NextResponse } from "next/server";
export function errorResponse(err: unknown) {
  if (err instanceof NoKeyError) {
    return NextResponse.json(
      { error: "no_key", message: "Voice features need an OpenAI API key." },
      { status: 503 },
    );
  }
  console.error("[openai]", err);
  return NextResponse.json(
    { error: "failed", message: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
