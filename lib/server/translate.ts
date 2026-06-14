// Server-side string translation for the form *document* layer (labels, legal
// instructions, questions) and for free-text answer values rendered on the
// user's-language copy. Mirrors i18nStore's grow-once cache, but with a prompt
// tuned for faithful translation of an official benefits form and its own cache
// file (data/i18n/forms.<lang>.json) so it never mixes with the UI dictionary.
// Degrades to English (identity) when no OpenAI key is configured.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getClient, MODELS, NoKeyError } from "@/lib/openai";

const DIR = join(process.cwd(), "data", "i18n");
const slugify = (target: string) => {
  const s = target.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  // Non-Latin labels (中文, 한국어, العربية, Русский) slug to "" — fall back to a
  // stable hex of the bytes so the cache key is filesystem-safe AND non-empty
  // (an empty slug would skip translation entirely and leave the copy English).
  return s || Buffer.from(target).toString("hex");
};
const file = (slug: string) => join(DIR, `forms.${slug}.json`);

function loadCache(slug: string): Record<string, string> {
  try {
    return JSON.parse(readFileSync(file(slug), "utf8"));
  } catch {
    return {};
  }
}
function saveCache(slug: string, map: Record<string, string>) {
  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(file(slug), JSON.stringify(map, null, 2));
  } catch {
    /* read-only filesystem (e.g. serverless): ignore */
  }
}

// Translate each English string into `target`, returning translations aligned to
// `texts` (1:1, same order). Cached so each phrase hits GPT only once, ever.
export async function translateStrings(
  texts: string[],
  target: string,
): Promise<string[]> {
  if (!texts.length || !target || target === "en" || target === "English") {
    return texts;
  }
  const slug = slugify(target);
  if (!slug) return texts;

  const cache = loadCache(slug);
  const missing = [...new Set(texts.filter((t) => t && !(t in cache)))];

  if (missing.length) {
    let client;
    try {
      client = getClient();
    } catch (err) {
      if (err instanceof NoKeyError) return texts.map((t) => cache[t] ?? t);
      throw err;
    }
    const system = [
      `Translate each English string into ${target}.`,
      "These strings are labels, instructions, questions, and answers from an official California benefits form (Homeless Assistance / CalWORKs).",
      "Translate faithfully and completely so a reader in that language understands the form exactly. Preserve a calm, plain, respectful tone.",
      "Keep US-specific terms recognizable and untranslated where appropriate: SSN, CalWORKs, CalFresh, Medi-Cal, ZIP, CW 42, SAWS.",
      "Preserve leading numbering/punctuation (e.g. \"1.\", \"(first, middle, last)\").",
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
    saveCache(slug, cache);
  }

  return texts.map((t) => cache[t] ?? t);
}
