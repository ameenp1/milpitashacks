import { NextRequest, NextResponse } from "next/server";
import { getClient, MODELS, errorResponse } from "@/lib/openai";
import { loadCache, saveCache } from "@/lib/server/i18nStore";

export const runtime = "nodejs";

// POST { texts: string[], target } -> { translations: string[] }
// Translates the user-facing layer only (questions, help, buttons). Backed by a
// growing per-language dataset (data/i18n/<lang>.json) so each phrase is sent to
// GPT only once. US terms stay recognizable (SSN, CalWORKs...).
export async function POST(req: NextRequest) {
  try {
    const { texts, target } = (await req.json()) as {
      texts?: string[];
      target?: string;
    };
    if (!texts?.length || !target || target === "en" || target === "English") {
      return NextResponse.json({ translations: texts ?? [] });
    }

    const cache = loadCache(target);
    const missing = [...new Set(texts.filter((t) => t && !(t in cache)))];

    if (missing.length) {
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
          { role: "user", content: JSON.stringify({ texts: missing }) },
        ],
      });
      const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
      const out: string[] = Array.isArray(parsed.translations)
        ? parsed.translations
        : missing;
      missing.forEach((m, i) => {
        cache[m] = out[i] ?? m;
      });
      saveCache(target, cache);
    }

    return NextResponse.json({
      translations: texts.map((t) => cache[t] ?? t),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
