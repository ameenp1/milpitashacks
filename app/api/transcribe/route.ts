import { NextRequest, NextResponse } from "next/server";
import { toFile } from "openai";
import { getClient, MODELS, errorResponse } from "@/lib/openai";

export const runtime = "nodejs";

// POST multipart { audio: Blob, language? } -> { text }
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "audio is required" }, { status: 400 });
    }
    const language = (form.get("language") as string) || undefined;
    const client = getClient();
    // Pick an extension OpenAI recognizes from the blob's MIME type
    // (iPad Safari records audio/mp4, Chrome audio/webm).
    const type = audio.type || "audio/webm";
    const ext = /mp4|m4a|mpeg|aac/.test(type)
      ? "mp4"
      : /ogg/.test(type)
        ? "ogg"
        : /wav/.test(type)
          ? "wav"
          : "webm";
    const file = await toFile(audio, `speech.${ext}`, { type });
    const res = await client.audio.transcriptions.create({
      model: MODELS.transcribe,
      file,
      language, // ISO-639-1 hint, e.g. "es"; optional
    });
    return NextResponse.json({ text: res.text });
  } catch (err) {
    return errorResponse(err);
  }
}
