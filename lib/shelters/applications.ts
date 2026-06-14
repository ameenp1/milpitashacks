// Bridges the applicant's local profile to the shelter dashboards. When an
// applicant picks shelters (see /choose-shelters), their *live* application —
// complete or not — is written to shelters/{shelterId}/applicants/{applicantId},
// the same path the dashboard already reads. So a shelter sees ongoing
// applications from the people who chose them, updating as they go.
//
// Privacy: we deliberately share only what a shelter needs to recognize and plan
// for someone — name, progress, and a short non-sensitive summary. SSN, DOB, and
// address never leave the device (those are only used to fill the county forms
// locally). Note: the project's Firestore is in test mode (open); production must
// add rules so only the chosen shelter can read its applicants.
import { doc, setDoc, deleteDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FORM_INDEX, getFormDef, getGroup } from "@/lib/data";
import { assessEligibility } from "@/lib/eligibility";
import type { Profile } from "@/lib/types";
import type { Applicant } from "./types";

const ID_KEY = "ha_applicant_id";
const SINCE_KEY = "ha_applicant_since";

// Stable per-device applicant identity (the Firestore doc id), created lazily.
export function getApplicantId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(ID_KEY, id);
  }
  return id;
}

function appliedSince(): string {
  if (typeof window === "undefined") return new Date().toISOString().slice(0, 10);
  let d = window.localStorage.getItem(SINCE_KEY);
  if (!d) {
    d = new Date().toISOString().slice(0, 10);
    window.localStorage.setItem(SINCE_KEY, d);
  }
  return d;
}

// Question groups that actually apply to this applicant (mapped to some form, and
// with any dependsOn condition met). sign_date is auto-filled, so it doesn't count.
function applicableGroups(answers: Record<string, string>): string[] {
  const need = new Set<string>();
  for (const f of FORM_INDEX)
    for (const field of getFormDef(f.id)?.fields ?? []) need.add(field.group);
  return [...need].filter((id) => {
    if (id === "sign_date") return false;
    const g = getGroup(id);
    if (!g) return false;
    return !g.dependsOn || answers[g.dependsOn.group] === g.dependsOn.equals;
  });
}

export function overallProgress(answers: Record<string, string>): number {
  const groups = applicableGroups(answers);
  if (!groups.length) return 0;
  const answered = groups.filter((id) => (answers[id] ?? "").trim()).length;
  return Math.round((answered / groups.length) * 100);
}

// A short, non-sensitive line a shelter can act on. Avoids disclosing the specific
// nature of any personal emergency (e.g. abuse) — just flags that one exists.
function needsSummary(answers: Record<string, string>): string {
  const parts: string[] = [];
  const hh = (answers.household_members ?? "").trim();
  if (hh) {
    const family = /\b(child|children|kid|son|daughter|baby|infant|wife|husband|partner|spouse|family)\b/i.test(hh);
    parts.push(family ? "Household / family" : "Single adult");
  }
  if (answers.is_pregnant === "Yes") parts.push("pregnant");
  if (assessEligibility(answers).immediateNeed.active) parts.push("urgent need");
  return parts.join(" · ") || "Application in progress";
}

export function buildApplicant(profile: Profile): Applicant {
  const answers = profile.answers;
  const progress = overallProgress(answers);
  return {
    id: getApplicantId(),
    name: (answers.full_name ?? "").trim() || "New applicant",
    appliedOn: appliedSince(),
    progress,
    needs: needsSummary(answers),
    status: progress >= 100 ? "complete" : "in_progress",
  };
}

// Upsert the application into each chosen shelter; remove it from any the applicant
// just unchose (prevShelterIds = the last-synced selection).
export async function syncApplication(
  applicant: Applicant,
  selectedShelterIds: string[],
  prevShelterIds: string[] = [],
): Promise<void> {
  await Promise.all(
    selectedShelterIds.map((sid) =>
      setDoc(doc(db, "shelters", sid, "applicants", applicant.id), applicant),
    ),
  );
  const removed = prevShelterIds.filter((id) => !selectedShelterIds.includes(id));
  await Promise.all(
    removed.map((sid) =>
      deleteDoc(doc(db, "shelters", sid, "applicants", applicant.id)).catch(() => {}),
    ),
  );
}

// Remove the application from every shelter it was sent to (used by "Delete my information").
export async function deleteApplication(
  applicantId: string,
  shelterIds: string[],
): Promise<void> {
  await Promise.all(
    shelterIds.map((sid) =>
      deleteDoc(doc(db, "shelters", sid, "applicants", applicantId)).catch(() => {}),
    ),
  );
}

// Live applicants for a shelter (real-time, so the dashboard updates as people
// answer questions). Returns the unsubscribe function.
export function watchApplicants(
  shelterId: string,
  cb: (applicants: Applicant[]) => void,
): () => void {
  return onSnapshot(collection(db, "shelters", shelterId, "applicants"), (snap) => {
    cb(snap.docs.map((d) => d.data() as Applicant).sort((a, b) => b.progress - a.progress));
  });
}
