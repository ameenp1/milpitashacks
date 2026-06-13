// Server-only: loads the knowledge base in context_docs/ once and concatenates
// it for the assistant's system prompt. These markdown files are the source of
// truth the BenefitsCal guide answers from (CalWORKs guide, Pub 13, SCD 2604,
// DB101). Cached in module scope so we read from disk only on the first request.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

let cached: string | null = null;

export function getContextDocs(): string {
  if (cached !== null) return cached;
  const dir = join(process.cwd(), "context_docs");
  const parts: string[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
    const body = readFileSync(join(dir, file), "utf8").trim();
    if (body) parts.push(`# Source: ${file}\n\n${body}`);
  }
  cached = parts.join("\n\n---\n\n");
  return cached;
}
