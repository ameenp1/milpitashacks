import { NextRequest, NextResponse } from "next/server";
import { getClient, MODELS, errorResponse } from "@/lib/openai";

export const runtime = "nodejs";

// POST { text, voice? } -> audio/mpeg
export async function POST(req: NextRequest) {
  try {
    const { text, voice = "alloy" } = (await req.json()) as {
      text?: string;
      voice?: string;
    };
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    const client = getClient();
    const speech = await client.audio.speech.create({
      model: MODELS.tts,
      voice,
      input: text,
      response_format: "mp3",
    });
    const buf = Buffer.from(await speech.arrayBuffer());
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
