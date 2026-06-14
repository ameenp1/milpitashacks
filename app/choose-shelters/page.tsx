"use client";
// Applicant-facing: pick the shelters you want to apply to. Your selection is
// saved locally and your live application is shared with those shelters (see
// lib/shelters/useApplicationSync), so they can see you even before you finish.
import { useEffect, useState } from "react";
import Link from "next/link";
import { listShelters } from "@/lib/shelters/store";
import type { Shelter, County } from "@/lib/shelters/types";
import { useAppState, setSelectedShelters } from "@/lib/profile";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";

type PublicShelter = Omit<Shelter, "password">;
const COUNTIES: County[] = ["Santa Clara", "San Francisco"];

export default function ChooseSheltersPage() {
  const { selectedShelterIds } = useAppState();
  const { showToast } = useToast();
  const [shelters, setShelters] = useState<PublicShelter[] | null>(null);

  const t = useT([
    "Apply to shelters",
    "Choose the shelters you want to apply to",
    "They can see your application as you fill it out — even if it isn't finished yet. We share your name and what you need. We never share your SSN.",
    "Apply here",
    "Applied",
    "beds",
    "Loading shelters…",
    "Applying to",
    "shelters",
    "No shelters selected yet.",
    "Back to my forms",
    "Review and download",
    "These shelters can now see your application.",
  ]);

  useEffect(() => {
    listShelters()
      .then(setShelters)
      .catch(() => {
        showToast(t("Loading shelters…"), "error");
        setShelters([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: string) {
    const next = selectedShelterIds.includes(id)
      ? selectedShelterIds.filter((x) => x !== id)
      : [...selectedShelterIds, id];
    setSelectedShelters(next);
    if (next.length > selectedShelterIds.length) {
      showToast(t("These shelters can now see your application."), "success");
    }
  }

  return (
    <main className="pb-28">
      <section className="border-b border-line bg-brand-tint">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            {t("Apply to shelters")}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">
            {t("Choose the shelters you want to apply to")}
          </h1>
          <p className="mt-3 text-ink/70">
            {t(
              "They can see your application as you fill it out — even if it isn't finished yet. We share your name and what you need. We never share your SSN.",
            )}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {shelters === null ? (
          <p className="text-ink/55">{t("Loading shelters…")}</p>
        ) : (
          <div className="space-y-8">
            {COUNTIES.map((county) => {
              const list = shelters.filter((s) => s.county === county);
              if (list.length === 0) return null;
              return (
                <section key={county}>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">
                    {county} County
                  </h2>
                  <div className="space-y-3">
                    {list.map((s) => {
                      const applied = selectedShelterIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          className={`flex items-start justify-between gap-4 rounded-lg border bg-white p-4 transition ${
                            applied ? "border-brand ring-1 ring-brand/20" : "border-line"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-lg font-bold text-navy">{s.name}</div>
                            <div className="text-sm text-ink/55">
                              {s.address} · {s.capacity} {t("beds")}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {s.focus.map((f) => (
                                <span
                                  key={f}
                                  className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggle(s.id)}
                            aria-pressed={applied}
                            className={`shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition ${
                              applied
                                ? "bg-brand text-white hover:bg-brand-dark"
                                : "border border-brand/40 text-brand hover:border-brand"
                            }`}
                          >
                            {applied ? `✓ ${t("Applied")}` : t("Apply here")}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky summary + continue */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm text-ink/70">
            {selectedShelterIds.length > 0
              ? `${t("Applying to")} ${selectedShelterIds.length} ${t("shelters")}`
              : t("No shelters selected yet.")}
          </span>
          <div className="flex gap-2">
            <Link
              href="/forms"
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink/70 hover:border-brand hover:text-ink"
            >
              {t("Back to my forms")}
            </Link>
            <Link
              href="/review"
              className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {t("Review and download")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
