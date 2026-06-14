"use client";
// Invisible: keeps the applicant's chosen shelters up to date with their live
// application. Mounted once in Providers.
import { useApplicationSync } from "@/lib/shelters/useApplicationSync";

export function ApplicationSync() {
  useApplicationSync();
  return null;
}
