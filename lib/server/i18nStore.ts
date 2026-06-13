// Server-side translation dataset: a growing per-language cache so each phrase
// is translated by GPT only once, ever (across all users). Persists to
// data/i18n/<lang>.json. On read-only hosts the writes no-op (wrapped).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "data", "i18n");
const slugify = (target: string) =>
  target.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const file = (slug: string) => join(DIR, slug + ".json");

export function loadCache(target: string): Record<string, string> {
  const slug = slugify(target);
  if (!slug) return {};
  try {
    return JSON.parse(readFileSync(file(slug), "utf8"));
  } catch {
    return {};
  }
}

export function saveCache(target: string, map: Record<string, string>) {
  const slug = slugify(target);
  if (!slug) return; // ignore empty/garbage targets (don't write _.json)
  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(file(slug), JSON.stringify(map, null, 2));
  } catch {
    /* read-only filesystem (e.g. serverless): ignore */
  }
}
