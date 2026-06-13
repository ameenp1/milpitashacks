// Status helpers shared by the preview, checklist, and review screens.
import type { Field, FormDef, FormStatus } from "./types";
import { getGroup } from "./data";

export type FieldStatus = "filled" | "review" | "missing";

export function answerFor(
  field: Field,
  answers: Record<string, string>,
): string {
  return (answers[field.group] ?? "").trim();
}

export function fieldStatus(
  field: Field,
  answers: Record<string, string>,
): FieldStatus {
  const value = answerFor(field, answers);
  if (!value) return "missing";
  const groupNeedsReview = getGroup(field.group)?.needsReview;
  if (field.needsReview || groupNeedsReview) return "review";
  return "filled";
}

export interface FormProgress {
  total: number;
  filled: number; // includes review (has a value)
  missing: number;
  needsReview: number; // fields flagged for review that have a value
  fillState: Exclude<FormStatus, "complete">;
}

export function formProgress(
  def: FormDef,
  answers: Record<string, string>,
): FormProgress {
  let filled = 0;
  let needsReview = 0;
  for (const f of def.fields) {
    const s = fieldStatus(f, answers);
    if (s !== "missing") filled++;
    if (s === "review") needsReview++;
  }
  const total = def.fields.length;
  const missing = total - filled;
  const fillState =
    filled === 0
      ? "not_started"
      : missing === 0
        ? "needs_review"
        : "in_progress";
  return { total, filled, missing, needsReview, fillState };
}

export function formStatus(
  def: FormDef,
  answers: Record<string, string>,
  reviewed: boolean,
): FormStatus {
  const { fillState } = formProgress(def, answers);
  if (reviewed && fillState === "needs_review") return "complete";
  return fillState;
}

export const STATUS_LABEL: Record<FormStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  needs_review: "Needs review",
  complete: "Complete",
};
