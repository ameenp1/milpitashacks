// Client-side app state: the applicant's profile + which forms they marked
// reviewed. Lives ONLY in localStorage (privacy-first) and is exposed to React
// via useSyncExternalStore. "Delete my information" clears it entirely.
import { useSyncExternalStore } from "react";
import type { Profile } from "./types";

export interface AppState {
  profile: Profile;
  reviewed: string[]; // form ids the applicant confirmed
  signature?: string; // data URL of the e-signature
  selectedShelterIds: string[]; // shelters the applicant chose to apply to
}

const KEY = "ha_state";

const EMPTY: AppState = {
  profile: { language: "en", languageLabel: "English", answers: {} },
  reviewed: [],
  selectedShelterIds: [],
};

function load(): AppState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as AppState;
    return {
      profile: {
        language: parsed.profile?.language ?? "en",
        languageLabel: parsed.profile?.languageLabel ?? "English",
        answers: parsed.profile?.answers ?? {},
      },
      reviewed: parsed.reviewed ?? [],
      signature: parsed.signature,
      selectedShelterIds: parsed.selectedShelterIds ?? [],
    };
  } catch {
    return EMPTY;
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }
}
function set(next: AppState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// --- actions ---
export function setLanguage(language: string, languageLabel: string) {
  set({ ...state, profile: { ...state.profile, language, languageLabel } });
}
export function setAnswer(group: string, value: string) {
  set({
    ...state,
    profile: {
      ...state.profile,
      answers: { ...state.profile.answers, [group]: value },
    },
  });
}
export function markReviewed(formId: string, reviewed = true) {
  const has = state.reviewed.includes(formId);
  if (reviewed && !has) set({ ...state, reviewed: [...state.reviewed, formId] });
  if (!reviewed && has)
    set({ ...state, reviewed: state.reviewed.filter((id) => id !== formId) });
}
export function setSignature(dataUrl: string | undefined) {
  set({ ...state, signature: dataUrl });
}
export function setSelectedShelters(ids: string[]) {
  set({ ...state, selectedShelterIds: ids });
}
export function clearAll() {
  // Wipe everything this app ever stored, including cached translations and the
  // applicant id used to key the Firestore application (Firestore docs themselves
  // are removed by the caller before this, since it needs the selection list).
  if (typeof window !== "undefined") {
    Object.keys(window.localStorage)
      .filter((k) => k === KEY || k === "ha_applicant_id" || k.startsWith("ha_tr_"))
      .forEach((k) => window.localStorage.removeItem(k));
  }
  set({
    profile: { language: "en", languageLabel: "English", answers: {} },
    reviewed: [],
    signature: undefined,
    selectedShelterIds: [],
  });
}

// --- hooks ---
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}
export function useProfile(): Profile {
  return useAppState().profile;
}
