// One-time preprocessing stage (run: `npm run preprocess`).
//
// For each official form it:
//   1. reads word/document.xml,
//   2. locates each field by a unique label "anchor" (matched against a
//      paragraph's concatenated text, since Word splits labels across runs),
//   3. injects a `{{token}}` run right before that paragraph's </w:p>,
//   4. writes the placeholdered copy to data/templates/<form>.docx,
//   5. emits data/forms/<form>.json (field map) + shared group/profile JSON.
//
// CW42 (the priority form) is fully curated. The other forms auto-detect the
// most-repeated shared identity fields by keyword so the profile reuses across
// forms. Originals in forms/ are never modified.

import PizZip from "pizzip";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

type AnswerType =
  | "text" | "longtext" | "name" | "date" | "ssn" | "phone" | "email"
  | "number" | "money" | "boolean" | "choice" | "address";

interface QuestionGroup {
  id: string;
  question: string;
  help?: string;
  answerType: AnswerType;
  choices?: string[];
  isCore: boolean;
  needsReview?: boolean;
  order?: number;
  dependsOn?: { group: string; equals: string };
}
interface Field {
  id: string;
  token: string;
  group: string;
  anchor: string;
  answerType: AnswerType;
  needsReview?: boolean;
}
interface FormDef {
  id: string;
  code: string;
  title: string;
  description: string;
  fields: Field[];
}

const ROOT = process.cwd();
const DATA = join(ROOT, "data");
const TEMPLATES = join(DATA, "templates");
const FORMS_OUT = join(DATA, "forms");

// --------------------------------------------------------------------------
// Canonical question groups (the result of "extract + group", curated once).
// --------------------------------------------------------------------------
const GROUPS: QuestionGroup[] = [
  { id: "full_name", order: 1, isCore: true, answerType: "name",
    question: "What is your full name?",
    help: "Say your first name, middle name, and last name." },
  { id: "dob", order: 2, isCore: true, answerType: "date",
    question: "What is your date of birth?",
    help: "The month, day, and year you were born." },
  { id: "ssn", order: 3, isCore: true, answerType: "ssn", needsReview: true,
    question: "What is your Social Security Number (SSN)?",
    help: "Your 9-digit SSN. The county uses it to check your identity. We will ask you to review this one." },
  { id: "phone", order: 4, isCore: true, answerType: "phone",
    question: "What is a phone number where we can reach you?",
    help: "A number where a worker can leave you a message." },
  { id: "email", order: 5, isCore: true, answerType: "email",
    question: "What is your email address, if you have one?",
    help: "Optional. Used for appointment reminders." },
  { id: "address", order: 6, isCore: true, answerType: "address",
    question: "What is your current or most recent home address?",
    help: "Street, city, state, and ZIP. If you have no address, say where you usually stay." },
  { id: "household_members", order: 7, isCore: true, answerType: "longtext",
    question: "Who lives with you? Please give names and ages.",
    help: "Everyone in your household, including children." },
  { id: "gets_cash_aid", order: 8, isCore: true, answerType: "boolean",
    choices: ["Yes", "No"],
    question: "Do you currently get Cash Aid (CalWORKs)?",
    help: "Monthly cash assistance from the county." },
  { id: "cash_aid_county", isCore: false, answerType: "text",
    dependsOn: { group: "gets_cash_aid", equals: "Yes" },
    question: "Which county gives you Cash Aid?" },
  { id: "prior_ha", order: 9, isCore: true, answerType: "boolean",
    choices: ["Yes", "No"],
    question: "Have you ever received Homeless Assistance before?",
    help: "Homeless Assistance is usually limited to once every 12 months." },
  { id: "prior_ha_details", isCore: false, answerType: "text",
    dependsOn: { group: "prior_ha", equals: "Yes" },
    question: "Which county gave it to you, and roughly when?" },
  { id: "household_income", order: 10, isCore: true, answerType: "longtext",
    question: "Does anyone in your home earn money from a job, training, or any other source?",
    help: "If yes, say who earns it and about how much." },
  { id: "liquid_resources", order: 11, isCore: true, answerType: "longtext",
    question: "How much money do you have right now in cash, checking, and savings?",
    help: "To get Homeless Assistance you must have less than $100 in resources." },
  { id: "has_home", order: 12, isCore: true, answerType: "boolean",
    choices: ["Yes", "No"],
    question: "Do you have a place to live right now?",
    help: "If no, we will ask where you are staying. If you got an eviction notice, we will ask about back rent." },
  { id: "where_staying", order: 13, isCore: true, answerType: "longtext",
    dependsOn: { group: "has_home", equals: "No" },
    question: "Where are you staying right now?" },
  { id: "how_long_there", order: 14, isCore: true, answerType: "text",
    dependsOn: { group: "has_home", equals: "No" },
    question: "How long have you been staying there?" },
  { id: "pay_to_stay", order: 15, isCore: true, answerType: "text",
    dependsOn: { group: "has_home", equals: "No" },
    question: "Do you pay to stay there? If so, how much?" },
  { id: "why_homeless", order: 16, isCore: true, answerType: "longtext",
    dependsOn: { group: "has_home", equals: "No" },
    question: "Can you explain why you have no place to live?" },
  { id: "seeking_housing", order: 17, isCore: true, answerType: "longtext",
    dependsOn: { group: "has_home", equals: "No" },
    question: "Are you looking for permanent housing? Please explain." },
  { id: "payment_preference", order: 18, isCore: true, answerType: "choice",
    choices: ["Yourself", "Landlord", "Shelter", "Other"],
    question: "If you get Homeless Assistance money, who should it be paid to?",
    help: "You can have it paid to yourself, a landlord, a shelter, or someone else." },
  { id: "has_eviction_notice", order: 19, isCore: true, answerType: "boolean",
    choices: ["Yes", "No"],
    question: "Did you get a 'pay rent or quit' (eviction) notice?",
    help: "If yes, you may be able to get help with up to two months of back rent." },
  { id: "eviction_notice_date", isCore: false, answerType: "date",
    dependsOn: { group: "has_eviction_notice", equals: "Yes" },
    question: "What day did you get the pay rent or quit notice?" },
  { id: "months_back_rent", isCore: false, answerType: "number",
    dependsOn: { group: "has_eviction_notice", equals: "Yes" },
    question: "How many months of back rent do you owe?" },
  { id: "monthly_rent", isCore: false, answerType: "money",
    dependsOn: { group: "has_eviction_notice", equals: "Yes" },
    question: "How much is your monthly rent?" },
  { id: "why_unpaid_rent", isCore: false, answerType: "longtext",
    dependsOn: { group: "has_eviction_notice", equals: "Yes" },
    question: "Why weren't you able to pay your rent?" },
  { id: "why_evicting", isCore: false, answerType: "longtext",
    dependsOn: { group: "has_eviction_notice", equals: "Yes" },
    question: "Why is your landlord evicting you?" },
  { id: "us_citizen", order: 20, isCore: true, answerType: "boolean",
    choices: ["Yes", "No"],
    question: "Are you a United States citizen?",
    help: "Used for voter registration eligibility. It does not affect your aid." },
  { id: "wants_to_register_vote", isCore: false, answerType: "boolean",
    choices: ["Yes", "No"],
    question: "Would you like to register to vote?",
    help: "Your choice will not affect the help you get from the county." },
];

// --------------------------------------------------------------------------
// CW42 — fully curated field map. anchor = unique label substring.
// --------------------------------------------------------------------------
const CW42_FIELDS: Omit<Field, "token">[] = [
  { id: "name", group: "full_name", anchor: "Name of Caretaker Relative", answerType: "name" },
  { id: "phone", group: "phone", anchor: "Message Phone", answerType: "phone" },
  { id: "ssn", group: "ssn", anchor: "Social Security Number", answerType: "ssn", needsReview: true },
  { id: "dob", group: "dob", anchor: "Date of Birth", answerType: "date" },
  { id: "address", group: "address", anchor: "What is your current or last address", answerType: "address" },
  { id: "cash_aid", group: "gets_cash_aid", anchor: "Do you get Cash Aid", answerType: "boolean" },
  { id: "cash_aid_county", group: "cash_aid_county", anchor: "in which county", answerType: "text" },
  { id: "prior_ha", group: "prior_ha", anchor: "Did you get Homeless Assistance from any county", answerType: "boolean" },
  { id: "income", group: "household_income", anchor: "Does anyone in your home get income", answerType: "longtext" },
  { id: "resources", group: "liquid_resources", anchor: "List all liquid resources you own", answerType: "longtext" },
  { id: "payment_pref", group: "payment_preference", anchor: "how you want the payment made", answerType: "choice" },
  { id: "where_staying", group: "where_staying", anchor: "Explain where you are staying now", answerType: "longtext" },
  { id: "how_long", group: "how_long_there", anchor: "How long have you been there", answerType: "text" },
  { id: "pay_to_stay", group: "pay_to_stay", anchor: "Do you pay for staying there", answerType: "text" },
  { id: "why_homeless", group: "why_homeless", anchor: "Explain why you have no place to live", answerType: "longtext" },
  { id: "seeking", group: "seeking_housing", anchor: "Are you seeking permanent housing", answerType: "longtext" },
  { id: "eviction_date", group: "eviction_notice_date", anchor: "What day did you get a pay rent or quit notice", answerType: "date" },
  { id: "months_back", group: "months_back_rent", anchor: "How many months of back rent do you owe", answerType: "number" },
  { id: "monthly_rent", group: "monthly_rent", anchor: "How much is your monthly rent", answerType: "money" },
  { id: "why_unpaid", group: "why_unpaid_rent", anchor: "pay your rent", answerType: "longtext" },
  { id: "why_evict", group: "why_evicting", anchor: "Why is your Landlord evicting you", answerType: "longtext" },
];

// Keyword auto-detection for the other forms (first occurrence of each).
const AUTO: { group: string; answerType: AnswerType; test: (t: string) => boolean; needsReview?: boolean }[] = [
  { group: "ssn", answerType: "ssn", needsReview: true,
    test: (t) => /social security/i.test(t) && t.length < 90 && !/required to give/i.test(t) },
  { group: "dob", answerType: "date",
    test: (t) => /date of birth|birthdate/i.test(t) && t.length < 90 },
  { group: "phone", answerType: "phone",
    test: (t) => /(telephone|phone)\s*(number|no\.?|#)?/i.test(t) && t.length < 70 },
  { group: "email", answerType: "email",
    test: (t) => /e-?mail/i.test(t) && t.length < 70 },
];

const FORM_META: { id: string; code: string; title: string; description: string }[] = [
  { id: "cw42", code: "CW 42", title: "Statement of Facts — Homeless Assistance",
    description: "Tells the county your housing situation and why you need homeless assistance." },
  { id: "cw74", code: "CW 74", title: "Permanent Housing Search Document",
    description: "A log of your search for permanent housing while you receive temporary shelter." },
  { id: "saws1", code: "SAWS 1", title: "Application for Cash Aid, CalFresh, and/or Medi-Cal",
    description: "Starts your application for benefits on the day you sign it." },
  { id: "saws2plus", code: "SAWS 2 PLUS", title: "Application for CalFresh, Cash Aid, and/or Medi-Cal",
    description: "The main application with your household, income, and resource details." },
  { id: "saws2asar", code: "SAWS 2A SAR", title: "Rights, Responsibilities and Other Important Information",
    description: "Explains your rights and responsibilities. Mostly for your records." },
  { id: "scd508", code: "SCD 508", title: "Voter Registration",
    description: "Lets you choose whether you would like to register to vote." },
];

// --------------------------------------------------------------------------
const stripTags = (s: string) => s.replace(/<[^>]+>/g, "");
const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const paraText = (p: string) => decode(stripTags(p)).replace(/\s+/g, " ").trim();

function tokenRun(token: string): string {
  return `<w:r><w:t xml:space="preserve"> {{${token}}}</w:t></w:r>`;
}

// Inject token runs into document.xml; return new xml + which fields were placed.
function inject(xml: string, fields: Field[]): { xml: string; placed: Set<string> } {
  const placed = new Set<string>();
  const out = xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, (para) => {
    const t = paraText(para);
    if (!t) return para;
    const f = fields.find((f) => !placed.has(f.id) && t.includes(f.anchor));
    if (!f) return para;
    placed.add(f.id);
    return para.replace(/<\/w:p>$/, tokenRun(f.token) + "</w:p>");
  });
  return { xml: out, placed };
}

// Build a markdown view of the form with each field shown inline as its
// {{token}} — the working representation the chat/adeu engine edits.
function toMarkdown(xml: string, fields: Field[]): string {
  const placed = new Set<string>();
  const lines: string[] = [];
  const paras = xml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) ?? [];
  for (const p of paras) {
    let t = paraText(p);
    const f = fields.find((f) => !placed.has(f.id) && t.includes(f.anchor));
    if (f) {
      placed.add(f.id);
      t = t ? `${t} {{${f.token}}}` : `{{${f.token}}}`;
    }
    if (t) lines.push(t);
  }
  return lines.join("\n");
}

// Auto-detect shared fields for non-curated forms.
function autoFields(formId: string, xml: string): Field[] {
  const paras = xml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) ?? [];
  const fields: Field[] = [];
  const usedGroups = new Set<string>();
  for (const p of paras) {
    const t = paraText(p);
    if (!t) continue;
    for (const a of AUTO) {
      if (usedGroups.has(a.group)) continue;
      if (a.test(t)) {
        usedGroups.add(a.group);
        fields.push({
          id: a.group,
          token: `${formId}__${a.group}`,
          group: a.group,
          anchor: t.slice(0, Math.min(t.length, 40)),
          answerType: a.answerType,
          needsReview: a.needsReview,
        });
      }
    }
  }
  return fields;
}

function processForm(meta: { id: string; code: string; title: string; description: string }): FormDef {
  const srcPath = join(ROOT, "forms", `${meta.id}.docx`);
  const zip = new PizZip(readFileSync(srcPath));
  const xml = zip.file("word/document.xml")!.asText();

  let fields: Field[];
  if (meta.id === "cw42") {
    fields = CW42_FIELDS.map((f) => ({ ...f, token: `cw42__${f.id}` }));
  } else {
    fields = autoFields(meta.id, xml);
  }

  const { xml: filledXml, placed } = inject(xml, fields);
  const missing = fields.filter((f) => !placed.has(f.id));
  if (missing.length) {
    console.warn(`  ! ${meta.id}: anchor not found for ${missing.map((f) => f.id).join(", ")}`);
  }
  const kept = fields.filter((f) => placed.has(f.id));

  zip.file("word/document.xml", filledXml);
  writeFileSync(
    join(TEMPLATES, `${meta.id}.docx`),
    zip.generate({ type: "nodebuffer", compression: "DEFLATE" }),
  );

  // md working representation (tokens at field slots)
  writeFileSync(join(FORMS_OUT, `${meta.id}.md`), toMarkdown(xml, kept));

  const def: FormDef = { id: meta.id, code: meta.code, title: meta.title, description: meta.description, fields: kept };
  writeFileSync(join(FORMS_OUT, `${meta.id}.json`), JSON.stringify(def, null, 2));
  console.log(`  ✓ ${meta.id}: ${kept.length} fields placed`);
  return def;
}

function main() {
  mkdirSync(TEMPLATES, { recursive: true });
  mkdirSync(FORMS_OUT, { recursive: true });

  console.log("Preprocessing forms…");
  const defs = FORM_META.map(processForm);

  writeFileSync(join(DATA, "question-groups.json"), JSON.stringify(GROUPS, null, 2));

  const core = GROUPS.filter((g) => g.isCore).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  writeFileSync(join(DATA, "profile-schema.json"), JSON.stringify(core, null, 2));

  const index = defs.map((d) => ({
    id: d.id, code: d.code, title: d.title, description: d.description, fieldCount: d.fields.length,
  }));
  writeFileSync(join(FORMS_OUT, "index.json"), JSON.stringify(index, null, 2));

  console.log(`\nDone. ${GROUPS.length} groups (${core.length} core), ${defs.length} forms.`);
}

main();
