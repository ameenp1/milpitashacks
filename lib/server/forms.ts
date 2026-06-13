// Server-only helpers for the md working representation (adeu).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getFormDef } from "@/lib/data";

export function getFormMarkdown(id: string): string {
  return readFileSync(join(process.cwd(), "data", "forms", `${id}.md`), "utf8");
}

// md with tokens replaced by current answers (blanks shown as [blank]) — used as
// context for the chat/LLM so it knows the form and what is still missing.
export function getFilledMarkdown(
  id: string,
  answers: Record<string, string>,
): string {
  const def = getFormDef(id);
  let md = getFormMarkdown(id);
  if (!def) return md;
  for (const f of def.fields) {
    const v = (answers[f.group] ?? "").trim();
    md = md.replaceAll(`{{${f.token}}}`, v || "[blank]");
  }
  return md;
}
