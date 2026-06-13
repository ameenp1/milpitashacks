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

// Signature image embed (revisions_2 L8). The captured e-signature travels as a
// normal answer (group "signature", a PNG data URL) so it flows through the same
// answers payload as everything else — no contract/route changes. We add the PNG
// part + relationship to the docx and render an inline drawing on the signature line.
const SIG_W = 1554480; // ~1.7 in (EMU)
const SIG_H = 508158; //  preserves the 520x170 signature canvas ratio
const SIG_REL = "rIdSig";

function embedSignature(zip: PizZip, dataUrl: string): string | null {
  const m = /^data:image\/png;base64,(.+)$/s.exec(dataUrl.trim());
  if (!m) return null;
  zip.file("word/media/sig_assistant.png", Buffer.from(m[1], "base64"));

  let ct = zip.file("[Content_Types].xml")!.asText();
  if (!/Extension="png"/.test(ct)) {
    ct = ct.replace(
      "</Types>",
      '<Default Extension="png" ContentType="image/png"/></Types>',
    );
    zip.file("[Content_Types].xml", ct);
  }

  let rels = zip.file("word/_rels/document.xml.rels")!.asText();
  if (!rels.includes(`Id="${SIG_REL}"`)) {
    rels = rels.replace(
      "</Relationships>",
      `<Relationship Id="${SIG_REL}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/sig_assistant.png"/></Relationships>`,
    );
    zip.file("word/_rels/document.xml.rels", rels);
  }
  return SIG_REL;
}

function imageRun(relId: string): string {
  // Namespaces wp/a/pic/r are already declared on the document root.
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${SIG_W}" cy="${SIG_H}"/><wp:docPr id="9001" name="Signature"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="9001" name="Signature"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${SIG_W}" cy="${SIG_H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
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

  const sigDataUrl = answers["signature"];
  const sigRelId = sigDataUrl ? embedSignature(zip, sigDataUrl) : null;

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
    // Stamp the e-signature image onto the signature line, ahead of the date.
    if (field.group === "sign_date" && sigRelId) {
      replacement = imageRun(sigRelId) + replacement;
    }
    xml = xml.replace(tokenRe, replacement);
  }

  zip.file("word/document.xml", xml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
