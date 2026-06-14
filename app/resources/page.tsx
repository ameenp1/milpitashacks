"use client";
import { useEffect, useState } from "react";
import { listShelters } from "@/lib/shelters/store";
import type { Shelter } from "@/lib/shelters/types";
import { FOOD_BANKS, TRANSIT, mapsUrl, type ResourcePlace } from "@/lib/resources/data";
import { ClockIcon, PhoneIcon } from "@/components/icons";

type Tab = "shelters" | "food" | "transit";

const TABS: { id: Tab; label: string }[] = [
  { id: "shelters", label: "Shelters" },
  { id: "food", label: "Food banks" },
  { id: "transit", label: "Transit" },
];

function PlaceCard({
  name,
  county,
  address,
  phone,
  hours,
  note,
}: {
  name: string;
  county: string;
  address: string;
  phone?: string;
  hours?: string;
  note?: string;
}) {
  return (
    <div className="rounded border border-line bg-white p-5">
      <div className="text-xs font-bold uppercase tracking-wide text-brand">
        {county} County
      </div>
      <h3 className="mt-1 text-lg font-bold text-navy">{name}</h3>
      <p className="mt-1 text-sm text-ink/75">{address}</p>
      {hours && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink/60">
          <ClockIcon className="h-4 w-4 shrink-0" />
          {hours}
        </p>
      )}
      {phone && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/60">
          <PhoneIcon className="h-4 w-4 shrink-0" />
          {phone}
        </p>
      )}
      {note && <p className="mt-2 text-sm text-ink/75">{note}</p>}
      <a
        href={mapsUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-bold text-link hover:underline"
      >
        Open in Maps →
      </a>
    </div>
  );
}

export default function ResourcesPage() {
  const [tab, setTab] = useState<Tab>("shelters");
  const [shelters, setShelters] = useState<Omit<Shelter, "password">[] | null>(null);

  useEffect(() => {
    listShelters()
      .then(setShelters)
      .catch(() => setShelters([]));
  }, []);

  return (
    <main>
      <section className="border-b border-line bg-brand-tint">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">
            Nearby resources
          </h1>
          <p className="mt-3 max-w-2xl text-ink/80">
            Shelters, food banks, and public transportation in Santa Clara and
            San Francisco counties.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex gap-1 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-[3px] px-4 py-2.5 text-sm font-bold transition ${
                tab === t.id
                  ? "border-brand text-brand"
                  : "border-transparent text-ink/55 hover:text-navy"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {tab === "shelters" &&
            (shelters === null ? (
              <p className="text-ink/55">Loading shelters…</p>
            ) : (
              shelters.map((s) => (
                <PlaceCard
                  key={s.id}
                  name={s.name}
                  county={s.county}
                  address={s.address}
                  phone={s.phone}
                  note={`${s.capacity} beds`}
                />
              ))
            ))}

          {tab === "food" &&
            FOOD_BANKS.map((p: ResourcePlace) => <PlaceCard key={p.id} {...p} />)}

          {tab === "transit" &&
            TRANSIT.map((p: ResourcePlace) => <PlaceCard key={p.id} {...p} />)}
        </div>
      </div>
    </main>
  );
}
