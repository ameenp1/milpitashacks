"use client";
// Pushes the applicant's live application to their chosen shelters whenever the
// profile or selection changes (debounced). No-ops until they've chosen at least
// one shelter, so it never writes for staff or undecided users. Mounted once,
// globally, via components/ApplicationSync.tsx.
import { useEffect, useRef } from "react";
import { useAppState } from "@/lib/profile";
import { buildApplicant, syncApplication } from "./applications";

export function useApplicationSync() {
  const { profile, selectedShelterIds } = useAppState();
  const syncedRef = useRef<string[]>([]); // last selection we wrote (to detect removals)
  const lastRef = useRef("");

  useEffect(() => {
    const removed = syncedRef.current.filter((id) => !selectedShelterIds.includes(id));
    if (selectedShelterIds.length === 0 && removed.length === 0) return;

    const applicant = buildApplicant(profile);
    const signature = JSON.stringify({ applicant, selectedShelterIds });
    if (signature === lastRef.current && removed.length === 0) return;

    const handle = setTimeout(() => {
      syncApplication(applicant, selectedShelterIds, syncedRef.current).catch(() => {});
      syncedRef.current = selectedShelterIds;
      lastRef.current = signature;
    }, 700);
    return () => clearTimeout(handle);
  }, [profile, selectedShelterIds]);
}
