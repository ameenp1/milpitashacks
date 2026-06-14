// LLM-assisted field extraction (run: `node scripts/extract-fields.ts <formId>`).
//
// Implements the brief's "extract questions -> regex/text match first -> GPT after
// to reduce calls -> group" pipeline. It PROPOSES a field map for a form by:
//   1. pulling candidate input labels out of data/forms/<id>.md (looksLikeFieldLabel
//      drops prose/headings so we don't stamp answers onto sentences),
//   2. a cheap regex/keyword pass that maps obvious repeats to existing groups,
//   3. one batched GPT-4o call (json) that proposes a group + answerType for the rest,
//      reusing an existing group id when it fits or naming a new one.
// Output: data/forms/_proposed/<id>.json — a REVIEW artifact. The authoritative map
// stays the hand-curated FIELD_MAP in scripts/preprocess.ts; a human merges the good
// rows in. This makes adding/deepening a form cheap without trusting the model blindly.

import OpenAI from "openai";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const formId = process.argv[2] ?? "saws2plus";

// --- tiny shared helpers (kept local so importing preprocess.ts can't run main) ---
const stripTags = (s: string) => s.replace(/<[^>]+>/g, "");
const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const clean = (s: string) => decode(stripTags(s)).replace(/\s+/g, " ").trim();

// Heuristic: is this line an actual fill-in label vs. running prose / a heading?
// (The bug class in errors.md: loose matching stamped answers onto sentences.)
function looksLikeFieldLabel(t: string): boolean {
  if (t.length < 3 || t.length > 140) return false;
  const words = t.split(/\s+/);
  const letters = t.replace(/[^A-Za-z]/g, "");
  const upperRatio = letters ? t.replace(/[^A-Z]/g, "").length / letters.length : 0;
  if (upperRatio > 0.6 && words.length <= 10) return true; // e.g. "SOCIAL SECURITY NUMBER"
  if (/[?:]\s*$/.test(t) && words.length <= 22) return true; // a question / labelled field
  const connectors = (t.toLowerCase().match(
    /\b(the|and|you|your|that|with|for|are|this|will|have|from|they|can|may|please|county|about)\b/g,
  ) ?? []).length;
  return connectors < 4 && words.length <= 12;
}

// Cheap pass: obvious repeats -> existing group ids (regex/text matching first).
const KEYWORDS: [RegExp, string][] = [
  [/social security|\bssn\b/i, "ssn"],
  [/date of birth|\bdob\b/i, "dob"],
  [/e-?mail/i, "email"],
  [/phone/i, "phone"],
  [/zip code|mailing address|home address|street address/i, "address"],
  [/name \(first|first, middle, last|full name/i, "full_name"],
  [/eviction|pay rent or (quit|leave)/i, "has_eviction_notice"],
  [/utilities.*(shut|shut-?off)/i, "utilities_shutoff"],
  [/food run out/i, "food_3_days"],
  [/pregnan/i, "is_pregnant"],
  [/migrant|seasonal farm worker/i, "migrant_worker"],
  [/essential clothing|diapers/i, "essential_clothing"],
  [/personal emergency/i, "personal_emergency"],
  [/cash aid|calworks/i, "gets_cash_aid"],
  [/liquid resources|cash on hand|checking and|savings account/i, "liquid_resources"],
];

interface Group { id: string; question: string; answerType: string }
interface Proposed { anchor: string; group: string; answerType: string; source: "regex" | "gpt"; needsReview?: boolean }

async function main() {
  const mdPath = join(ROOT, "data", "forms", `${formId}.md`);
  if (!existsSync(mdPath)) {
    console.error(`No ${mdPath}. Run \`npm run preprocess\` first.`);
    process.exit(1);
  }
  const groups = JSON.parse(
    readFileSync(join(ROOT, "data", "question-groups.json"), "utf8"),
  ) as Group[];
  const answerTypeOf = new Map(groups.map((g) => [g.id, g.answerType]));

  // 1. candidate labels (skip lines already carrying a {{token}} = already mapped).
  const lines = readFileSync(mdPath, "utf8").split("\n").map(clean);
  const seen = new Set<string>();
  const candidates = lines.filter((t) => {
    if (!t || t.includes("{{") || seen.has(t)) return false;
    seen.add(t);
    return looksLikeFieldLabel(t);
  });

  // 2. cheap regex/keyword pass.
  const matched: Proposed[] = [];
  const unmatched: string[] = [];
  for (const t of candidates) {
    const hit = KEYWORDS.find(([re]) => re.test(t));
    if (hit) matched.push({ anchor: t.slice(0, 60), group: hit[1], answerType: answerTypeOf.get(hit[1]) ?? "text", source: "regex" });
    else unmatched.push(t);
  }

  // 3. one batched GPT-4o call for the rest (only if a key is configured).
  let proposed: Proposed[] = [];
  const key = process.env.OPENAI_API_KEY ?? readEnvKey();
  if (key && unmatched.length) {
    const client = new OpenAI({ apiKey: key });
    const sys = [
      "You map government-form input labels to reusable question groups for a form-filling assistant.",
      "Existing groups (id: question):",
      ...groups.map((g) => `- ${g.id}: ${g.question}`),
      "For EACH label that is a real applicant fill-in field, return {anchor, group, answerType, needsReview}.",
      "- anchor: a short UNIQUE substring of the label to locate it.",
      "- group: reuse an existing id when it fits, else propose a new snake_case id.",
      "- answerType: one of text,longtext,name,date,ssn,phone,email,number,money,boolean,choice,address.",
      "- needsReview: true for sensitive/identity fields (ssn, etc.).",
      "Skip pure instructions, headings, and legal prose. Respond ONLY as JSON {\"fields\":[...]}.",
    ].join("\n");
    const res = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: unmatched.join("\n") },
      ],
    });
    try {
      const out = JSON.parse(res.choices[0]?.message?.content || "{}");
      proposed = (Array.isArray(out.fields) ? out.fields : []).map((f: Record<string, unknown>) => ({
        anchor: String(f.anchor ?? "").slice(0, 60),
        group: String(f.group ?? ""),
        answerType: String(f.answerType ?? "text"),
        needsReview: Boolean(f.needsReview) || undefined,
        source: "gpt" as const,
      })).filter((f: Proposed) => f.anchor && f.group);
    } catch {
      console.warn("  ! could not parse GPT proposal");
    }
  } else if (!key) {
    console.log("  (no OPENAI_API_KEY — skipping the GPT pass; regex matches only)");
  }

  const outDir = join(ROOT, "data", "forms", "_proposed");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${formId}.json`);
  writeFileSync(outPath, JSON.stringify(
    { formId, generatedAt: new Date().toISOString().slice(0, 10), regexMatched: matched, gptProposed: proposed }, null, 2,
  ));
  console.log(`${formId}: ${candidates.length} candidate labels -> ${matched.length} regex-matched, ${proposed.length} GPT-proposed`);
  console.log(`Review: ${outPath} (curated FIELD_MAP in scripts/preprocess.ts stays authoritative)`);
}

// Minimal .env.local reader (node scripts don't auto-load it).
function readEnvKey(): string | undefined {
  try {
    const env = readFileSync(join(ROOT, ".env.local"), "utf8");
    return env.match(/^OPENAI_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

main();
