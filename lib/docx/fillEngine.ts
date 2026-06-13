// Server-only DOCX fill engine (adeu apply step).
//
// Each template has `{{token}}` runs injected by scripts/preprocess.ts. For every
// field we replace that run based on its answer + approval state:
//   - no answer       -> gray "____" blank marker
//   - mode "clean"    -> accepted: plain near-black run (print / final)
//   - mode "export"   -> Word tracked change <w:ins> (redline)
//   - mode "preview"  -> blue underlined run (visible insertion in the live preview)
// Server-only: imported solely by API routes (uses node:fs + pizzip).
import PizZip from "pizzip";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getFormDef } from "@/lib/data";
import { answerFor } from "@/lib/status";

const escXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\s+/g, " ")
    .trim();

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function run(value: string, color: string, underline = false): string {
  const rpr = `<w:rPr><w:color w:val="${color}"/>${underline ? '<w:u w:val="single"/>' : ""}<w:sz w:val="16"/></w:rPr>`;
  return `<w:r>${rpr}<w:t xml:space="preserve"> ${escXml(value)}</w:t></w:r>`;
}
function blankRun(): string {
  return `<w:r><w:rPr><w:color w:val="9CA3AF"/><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve"> ____</w:t></w:r>`;
}

const DATE = "2024-01-01T00:00:00Z";

export interface FillOptions {
  mode?: "preview" | "export" | "clean";
}

export function fillDocx(
  formId: string,
  answers: Record<string, string>,
  opts: FillOptions = {},
): Buffer {
  const mode = opts.mode ?? "export";
  const def = getFormDef(formId);
  if (!def) throw new Error(`Unknown form: ${formId}`);

  const path = join(process.cwd(), "data", "templates", `${formId}.docx`);
  const zip = new PizZip(readFileSync(path));
  let xml = zip.file("word/document.xml")!.asText();

  let insId = 1000;
  for (const field of def.fields) {
    const tokenRe = new RegExp(
      `<w:r>\\s*<w:t xml:space="preserve">\\s*\\{\\{${escRe(field.token)}\\}\\}\\s*</w:t>\\s*</w:r>`,
    );
    const value = answerFor(field, answers);
    let replacement: string;
    if (!value) {
      replacement = blankRun();
    } else if (mode === "clean") {
      replacement = run(value, "111827"); // accepted, near-black
    } else if (mode === "export") {
      replacement = `<w:ins w:id="${insId++}" w:author="Form Assistant" w:date="${DATE}">${run(value, "1D4ED8")}</w:ins>`;
    } else {
      replacement = run(value, "1D4ED8", true); // preview: visible insertion
    }
    xml = xml.replace(tokenRe, replacement);
  }

  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
