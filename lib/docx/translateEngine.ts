// Server-only: translate a template's static document text into another language
// for the "your-language copy" of a form. Word splits every label into many tiny
// <w:t> runs (one per word/space), so we reassemble each paragraph's text, send
// the whole phrase to the translator, and write the result back into the
// paragraph's first text run (blanking the rest). The injected {{token}} runs are
// left byte-for-byte untouched, so the same fillEngine token replacement still
// works on the translated document.
import type { FormDef } from "@/lib/types";
import { translateStrings } from "@/lib/server/translate";

const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
const encode = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const isToken = (inner: string) => inner.includes("{{");
const hasLetters = (s: string) => /\p{L}/u.test(s);

interface TextEl {
  start: number;
  end: number;
  inner: string;
}
interface Segment {
  decoded: string; // reassembled, entity-decoded text to translate
  idxs: number[]; // indices into the paragraph's text-run list
}

function textRuns(paragraph: string): TextEl[] {
  const re = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
  const els: TextEl[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(paragraph))) {
    els.push({ start: m.index, end: re.lastIndex, inner: m[1] });
  }
  return els;
}

// Maximal spans of consecutive non-token runs that contain actual letters.
function segments(els: TextEl[]): Segment[] {
  const out: Segment[] = [];
  let i = 0;
  while (i < els.length) {
    if (isToken(els[i].inner)) {
      i++;
      continue;
    }
    const idxs: number[] = [];
    let raw = "";
    while (i < els.length && !isToken(els[i].inner)) {
      idxs.push(i);
      raw += els[i].inner;
      i++;
    }
    const dec = decode(raw);
    if (hasLetters(dec)) out.push({ decoded: dec, idxs });
  }
  return out;
}

const PARA_RE = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;

// Translate every static text segment in document.xml into `lang`. Degrades to
// the original (English) text when translation is unavailable (no API key).
export async function translateDocumentXml(
  xml: string,
  lang: string,
): Promise<string> {
  if (!lang || lang === "en" || lang === "English") return xml;

  // Pass 1: collect every unique phrase, then translate in one batch.
  const phrases = new Set<string>();
  for (const m of xml.matchAll(PARA_RE)) {
    for (const seg of segments(textRuns(m[0]))) phrases.add(seg.decoded);
  }
  if (!phrases.size) return xml;
  const list = [...phrases];
  const translated = await translateStrings(list, lang);
  const dict = new Map(list.map((p, i) => [p, translated[i] ?? p]));

  // Pass 2: rewrite each paragraph — first run of a segment gets the full
  // translation, the rest are emptied; token runs are preserved verbatim.
  return xml.replace(PARA_RE, (para) => {
    const els = textRuns(para);
    if (!els.length) return para;
    const newInner = new Array<string | null>(els.length).fill(null);
    for (const seg of segments(els)) {
      const tr = dict.get(seg.decoded) ?? seg.decoded;
      seg.idxs.forEach((idx, k) => {
        newInner[idx] = k === 0 ? encode(tr) : "";
      });
    }
    let out = "";
    let cursor = 0;
    els.forEach((el, k) => {
      out += para.slice(cursor, el.start);
      out +=
        newInner[k] === null
          ? para.slice(el.start, el.end)
          : `<w:t xml:space="preserve">${newInner[k]}</w:t>`;
      cursor = el.end;
    });
    return out + para.slice(cursor);
  });
}

// Free-text answer values, translated into `lang` for the your-language copy.
// Personal/structured values (name, SSN, dates, phone, money, address, the
// signature data URL) are left as-is. Returns a new answers map.
const FREE_TEXT = new Set(["text", "longtext", "choice", "boolean"]);

export async function translateAnswers(
  def: FormDef,
  answers: Record<string, string>,
  lang: string,
): Promise<Record<string, string>> {
  if (!lang || lang === "en" || lang === "English") return answers;

  const typeByGroup = new Map<string, string>();
  for (const f of def.fields) {
    if (!typeByGroup.has(f.group)) typeByGroup.set(f.group, f.answerType);
  }
  const entries = Object.entries(answers).filter(
    ([g, v]) => v?.trim() && FREE_TEXT.has(typeByGroup.get(g) ?? ""),
  );
  if (!entries.length) return answers;

  const translated = await translateStrings(
    entries.map(([, v]) => v),
    lang,
  );
  const out = { ...answers };
  entries.forEach(([g], i) => {
    out[g] = translated[i];
  });
  return out;
}
