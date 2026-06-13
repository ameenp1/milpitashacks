import { NextRequest, NextResponse } from "next/server";
import { getClient, MODELS, errorResponse } from "@/lib/openai";

export const runtime = "nodejs";

// POST { texts: string[], target } -> { translations: string[] }
// Translates the user-facing layer only (questions, help, buttons). The official
// form text is never translated. US terms stay recognizable (SSN, CalWORKs...).
export async function POST(req: NextRequest) {
  try {
    const { texts, target } = (await req.json()) as {
      texts?: string[];
      target?: string;
    };
    if (!texts?.length || !target || target === "en" || target === "English") {
      return NextResponse.json({ translations: texts ?? [] });
    }

    const client = getClient();
    const system = [
      `Translate each English UI string into ${target}.`,
      "Keep US-specific terms recognizable and untranslated where appropriate: SSN, CalWORKs, CalFresh, Medi-Cal, ZIP, CW 42, SAWS.",
      "Preserve meaning and a calm, plain, respectful tone for someone in housing crisis.",
      'Respond ONLY as JSON: {"translations": string[]} with exactly the same number of items, in the same order.',
    ].join("\n");

    const res = await client.chat.completions.create({
      model: MODELS.chat,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify({ texts }) },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
    const translations: string[] = Array.isArray(parsed.translations)
      ? parsed.translations
      : texts;
    // Guard against length drift.
    return NextResponse.json({
      translations: texts.map((t, i) => translations[i] ?? t),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
