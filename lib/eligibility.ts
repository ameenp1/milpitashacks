// Deterministic eligibility & immediate-need screening (decision SUPPORT, not a
// determination). Pure function over the profile answers — no I/O, no model calls,
// so it is explainable and testable. Every rule and dollar figure here is printed
// on the official forms / knowledge base (CW 42 "less than $100 in resources";
// SAWS 2 PLUS immediate-need screen: gross income < $150 & resources <= $100, food
// in 3 days, utilities shut-off, eviction, personal emergency). We never invent a
// rule, amount, or deadline, and always frame results as "you may qualify — a county
// worker confirms." Output strings come from a FIXED catalog (ELIGIBILITY_STRINGS)
// so the UI can translate each one through the existing i18n t()/ensure() path.

export type ProgramStatus = "likely" | "maybe";

export interface ProgramFinding {
  key: "ha" | "calfresh" | "cash_aid";
  label: string;
  status: ProgramStatus;
  reasons: string[];
}

export interface EligibilityResult {
  programs: ProgramFinding[];
  immediateNeed: { active: boolean; triggers: string[] };
  documents: string[];
  missingGroups: string[]; // group ids that gate the determination and are still blank
}

// --- fixed, translatable catalog ---------------------------------------------
const L = {
  ha: "CalWORKs Homeless Assistance",
  calfresh: "CalFresh (food benefits)",
  cashAid: "CalWORKs Cash Aid",
} as const;

const R = {
  haTemporary:
    "You said you don't have a place to live, so you may qualify for Temporary Homeless Assistance (emergency shelter).",
  haPermanent:
    "You have an eviction notice, so you may qualify for Permanent Homeless Assistance to help with back rent (up to two months).",
  haUnderLimit: "Your savings appear to be under the $100 limit for Homeless Assistance.",
  haOverLimit:
    "Your savings may be above the $100 limit for Homeless Assistance — a worker can review this with you.",
  haOncePerYear:
    "Homeless Assistance is usually limited to once every 12 months — ask your worker if you can get it again.",
  haIfLoseHousing: "If you lose your housing, you may qualify for Homeless Assistance.",
  cfFood3Days:
    "Your food may run out in 3 days, so you could get CalFresh food benefits within 3 days.",
  cfMigrant:
    "As a migrant or seasonal farm worker household with very little in resources, you may get faster CalFresh benefits.",
  cfLowIncome:
    "Your income and savings are very low, so you may qualify for faster CalFresh benefits.",
  cfBase: "You may qualify for CalFresh food benefits to help buy food.",
  cashAlready: "You already receive CalWORKs Cash Aid.",
  cashMaybe:
    "If you have children or are pregnant and have low income, you may qualify for CalWORKs Cash Aid.",
} as const;

// Immediate-need trigger phrases (used inside immediateNeed.triggers).
const T = {
  utilities: "your utilities are shut off or about to be",
  eviction: "an eviction notice",
  food: "your food running out",
  clothing: "a need for essential clothing",
  emergency: "a personal emergency",
  transport: "a need for emergency transportation",
} as const;

const DOC = {
  id: "Photo ID (driver's license, state ID, or passport)",
  ssn: "Social Security card or number for each person applying",
  income: "Proof of any income (pay stubs, award letters)",
  resources: "Proof of your money and resources (recent bank statements)",
  eviction: "Your 'pay rent or quit' (eviction) notice",
  utilities: "Your utility shut-off notice",
  staying: "Anything that shows where you have been staying, if you have it",
  pregnancy: "Proof of pregnancy (a note from your clinic), if you have it",
  children: "Birth certificates for the children applying, if you have them",
} as const;

// Short lines the chat speaks at the end of the interview (point to /review).
export const ELIGIBILITY_SUMMARY =
  "Here's what you may qualify for based on your answers. You can see the details and a document checklist on the review screen.";
export const ELIGIBILITY_IMMEDIATE =
  "It looks like you may be able to get help right away — ask the county worker about immediate help today.";

// Everything the UI may render, for one ensure() call (no English flicker).
export const ELIGIBILITY_STRINGS: string[] = [
  ...Object.values(L),
  ...Object.values(R),
  ...Object.values(T),
  ...Object.values(DOC),
  ELIGIBILITY_SUMMARY,
  ELIGIBILITY_IMMEDIATE,
];

// --- helpers -----------------------------------------------------------------
// Sum dollar amounts mentioned in a free-text money answer ("$20 cash, $30 checking").
function parseMoney(s?: string): number | null {
  if (!s) return null;
  const t = s.toLowerCase();
  if (/\b(none|nothing|no money|zero|broke)\b/.test(t) && !/[1-9]/.test(t)) return 0;
  const matches = [...t.matchAll(/\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(k|thousand)?/g)];
  if (!matches.length) return null;
  let sum = 0;
  for (const m of matches) sum += parseFloat(m[1].replace(/,/g, "")) * (m[2] ? 1000 : 1);
  return sum;
}

export function assessEligibility(answers: Record<string, string>): EligibilityResult {
  const yes = (id: string) => (answers[id] ?? "").trim() === "Yes";
  const has = (id: string) => !!(answers[id] ?? "").trim();

  // Resource test ($100 limit). "less than / under $100" counts as below.
  const resourcesText = answers.liquid_resources ?? "";
  const saysUnder = /less than|under|below|no more than/i.test(resourcesText);
  const resourcesNum = parseMoney(resourcesText);
  const lowResources: boolean | null = saysUnder
    ? true
    : resourcesNum === null
      ? null
      : resourcesNum < 100;

  // Income test (SAWS 2 PLUS expedited screen: gross income < $150).
  const incomeText = (answers.household_income ?? "").toLowerCase();
  const noIncome = /\b(none|no income|no job|unemployed|nothing|zero)\b/.test(incomeText) && !/[1-9]/.test(incomeText);
  const incomeNum = parseMoney(answers.household_income);
  const lowIncome = noIncome || (incomeNum !== null && incomeNum < 150);

  const hh = (answers.household_members ?? "").toLowerCase();
  const hasChildren =
    /\b(child|children|kid|kids|son|daughter|baby|infant|toddler|newborn)\b/.test(hh) ||
    /\b([0-9]|1[0-7])\s*(year|yr|yo|month)/.test(hh);

  const homeless = answers.has_home === "No";
  const eviction = yes("has_eviction_notice");

  // --- CalWORKs Homeless Assistance ---
  const haReasons: string[] = [];
  if (homeless) haReasons.push(R.haTemporary);
  if (eviction) haReasons.push(R.haPermanent);
  if (lowResources === true) haReasons.push(R.haUnderLimit);
  if (lowResources === false) haReasons.push(R.haOverLimit);
  if (yes("prior_ha")) haReasons.push(R.haOncePerYear);
  if (!homeless && !eviction) haReasons.push(R.haIfLoseHousing);
  const haStatus: ProgramStatus =
    (homeless || eviction) && lowResources === true ? "likely" : "maybe";

  // --- CalFresh (expedited where it applies) ---
  const cfReasons: string[] = [];
  const cfExpedited = yes("food_3_days") || yes("migrant_worker") || (lowIncome && lowResources !== false);
  if (yes("food_3_days")) cfReasons.push(R.cfFood3Days);
  if (yes("migrant_worker")) cfReasons.push(R.cfMigrant);
  if (lowIncome && lowResources !== false && !yes("food_3_days")) cfReasons.push(R.cfLowIncome);
  if (!cfReasons.length) cfReasons.push(R.cfBase);
  const cfStatus: ProgramStatus = cfExpedited ? "likely" : "maybe";

  // --- CalWORKs Cash Aid ---
  const cashReasons: string[] = [];
  let cashStatus: ProgramStatus = "maybe";
  if (yes("gets_cash_aid")) {
    cashReasons.push(R.cashAlready);
    cashStatus = "likely";
  } else {
    cashReasons.push(R.cashMaybe);
    cashStatus = (hasChildren || yes("is_pregnant")) && lowIncome ? "likely" : "maybe";
  }

  // --- Immediate need (emergency + little income/resources) ---
  const triggers: string[] = [];
  if (yes("utilities_shutoff")) triggers.push(T.utilities);
  if (eviction) triggers.push(T.eviction);
  if (yes("food_3_days")) triggers.push(T.food);
  if (yes("essential_clothing")) triggers.push(T.clothing);
  if (yes("personal_emergency")) triggers.push(T.emergency);
  if (yes("need_transport")) triggers.push(T.transport);
  const immediateActive = triggers.length > 0 && lowResources !== false;

  // --- supporting documents (dynamic) ---
  const documents: string[] = [DOC.id, DOC.ssn, DOC.income, DOC.resources];
  if (eviction) documents.push(DOC.eviction);
  if (yes("utilities_shutoff")) documents.push(DOC.utilities);
  if (homeless) documents.push(DOC.staying);
  if (yes("is_pregnant")) documents.push(DOC.pregnancy);
  if (hasChildren) documents.push(DOC.children);

  // --- info still needed for the determination ---
  const gating = ["household_members", "household_income", "liquid_resources", "has_home"];
  const missingGroups = gating.filter((g) => !has(g));

  return {
    programs: [
      { key: "ha", label: L.ha, status: haStatus, reasons: haReasons },
      { key: "calfresh", label: L.calfresh, status: cfStatus, reasons: cfReasons },
      { key: "cash_aid", label: L.cashAid, status: cashStatus, reasons: cashReasons },
    ],
    immediateNeed: { active: immediateActive, triggers },
    documents,
    missingGroups,
  };
}
