// Static accessors for the generated /data JSON. Safe to import on client or
// server (plain JSON, bundled). Binary templates are read separately, server-only.
import type { FormDef, FormSummary, QuestionGroup } from "./types";

import groupsJson from "@/data/question-groups.json";
import profileSchemaJson from "@/data/profile-schema.json";
import indexJson from "@/data/forms/index.json";
import cw42 from "@/data/forms/cw42.json";
import cw74 from "@/data/forms/cw74.json";
import saws1 from "@/data/forms/saws1.json";
import saws2plus from "@/data/forms/saws2plus.json";
import saws2asar from "@/data/forms/saws2asar.json";
import scd508 from "@/data/forms/scd508.json";

export const GROUPS = groupsJson as QuestionGroup[];
export const PROFILE_SCHEMA = profileSchemaJson as QuestionGroup[];
export const FORM_INDEX = indexJson as FormSummary[];

const FORM_DEFS: Record<string, FormDef> = {
  cw42: cw42 as FormDef,
  cw74: cw74 as FormDef,
  saws1: saws1 as FormDef,
  saws2plus: saws2plus as FormDef,
  saws2asar: saws2asar as FormDef,
  scd508: scd508 as FormDef,
};

export function getFormDef(id: string): FormDef | undefined {
  return FORM_DEFS[id];
}

const GROUP_BY_ID = new Map(GROUPS.map((g) => [g.id, g]));
export function getGroup(id: string): QuestionGroup | undefined {
  return GROUP_BY_ID.get(id);
}
