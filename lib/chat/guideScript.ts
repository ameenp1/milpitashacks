// Guide persona copy (Role 1). English SOURCE strings only — they flow through
// the i18n pipeline (ensure()/t()) at runtime, so this file is NOT translated
// here. Role 4 imports these to drive the greeting and the high-level queue
// ordering (CalWORKs-first vs. skip-to-housing). See ROLES.md (R1 L11, L4).

// Short acknowledgement Role 4 prepends to the next question so each bot turn is
// ONE combined utterance: `ACK + " " + nextQuestion` (revisions_2 L4).
export const ACK = "Thank you.";

// The assistant's opening turns: who it is, what it does, and the steps. Role 4
// appends these as the first bot messages (each its own line/turn is fine).
export const INTRO: string[] = [
  "Hi, I'm your homelessness assistance guide. I'll help you apply for help with housing, step by step — you can speak or type in your language, and you can ask me anything along the way.",
  "Here's how it works: first I'll ask you some questions about you and your household. Your answers automatically fill out the official county forms. Then you review everything on the right and download or print your packet.",
];

// CalWORKs-first decision (recommended route). Role 4 asks this before the
// interview and uses the answer to order the queue. The "skip to housing" path
// is a stub for now — convey it, don't fully branch.
export const CALWORKS_PROMPT =
  "First, would you like to apply for CalWORKs? CalWORKs is monthly cash aid, and it's what opens up Homeless Assistance — so it's the recommended place to start. If you already get CalWORKs, you can skip ahead to just the housing help.";

export const CALWORKS_CHOICES = [
  "Apply for CalWORKs first",
  "I already get CalWORKs — skip to housing",
];

// All guide strings R4 should pass to ensure() so they're translated before
// being shown (keeps the no-flicker rule). Kept in one place for convenience.
export const GUIDE_STRINGS: string[] = [
  ACK,
  ...INTRO,
  CALWORKS_PROMPT,
  ...CALWORKS_CHOICES,
];
