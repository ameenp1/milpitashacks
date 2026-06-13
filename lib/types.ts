// Shared data shapes for the form assistant.
// Generated JSON in /data conforms to these; the runtime app reads it read-only.

export type AnswerType =
  | "text"
  | "longtext"
  | "name"
  | "date"
  | "ssn"
  | "phone"
  | "email"
  | "number"
  | "money"
  | "boolean"
  | "choice"
  | "address";

export interface QuestionGroup {
  id: string; // canonical group id, e.g. "full_name"
  question: string; // plain-language question (English source)
  help?: string; // plain-language explanation of why we ask / what counts
  answerType: AnswerType;
  choices?: string[]; // for choice / boolean
  isCore: boolean; // part of the short voice interview
  needsReview?: boolean; // always flag for human review
  order?: number; // interview order for core questions
  dependsOn?: { group: string; equals: string }; // conditional question
}

export interface Field {
  id: string; // unique within a form
  token: string; // placeholder token injected into the template
  group: string; // QuestionGroup id this field is filled from
  anchor: string; // unique label substring locating the injection point
  answerType: AnswerType;
  needsReview?: boolean;
}

export interface FormDef {
  id: string; // "cw42"
  code: string; // "CW 42"
  title: string; // "Statement of Facts — Homeless Assistance"
  description: string;
  fields: Field[];
}

export interface FormSummary {
  id: string;
  code: string;
  title: string;
  description: string;
  fieldCount: number;
}

// Runtime applicant data — lives only in the browser (localStorage).
export interface Profile {
  language: string; // BCP-47-ish code or label, e.g. "en", "es"
  languageLabel: string; // human label, e.g. "English", "Español"
  answers: Record<string, string>; // group id -> answer
}

export type FormStatus =
  | "not_started"
  | "in_progress"
  | "needs_review"
  | "complete";
