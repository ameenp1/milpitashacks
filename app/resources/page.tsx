"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listShelters } from "@/lib/shelters/store";
import type { Shelter } from "@/lib/shelters/types";
import { FOOD_BANKS, TRANSIT, mapsUrl, type ResourcePlace } from "@/lib/resources/data";

type Tab = "shelters" | "food" | "transit";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "shelters", label: "Shelters", icon: "🏠" },
  { id: "food", label: "Food banks", icon: "🥫" },
  { id: "transit", label: "Transit", icon: "🚌" },
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
    <div className="rounded-xl border border-neutral-200 p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        {county} County
      </div>
      <h3 className="mt-1 text-lg font-semibold text-neutral-900">{name}</h3>
      <p className="mt-1 text-sm text-neutral-600">{address}</p>
      {hours && <p className="mt-1 text-sm text-neutral-500">🕑 {hours}</p>}
      {phone && <p className="mt-1 text-sm text-neutral-500">📞 {phone}</p>}
      {note && <p className="mt-2 text-sm text-neutral-600">{note}</p>}
      <a
        href={mapsUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline"
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
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <Link href="/home" className="mb-6 inline-block text-sm text-neutral-400 hover:text-neutral-700">
        ← Back
      </Link>

      <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
        Nearby resources
      </h1>
      <p className="mt-3 text-neutral-600">
        Shelters, food banks, and public transportation in Santa Clara and San
        Francisco counties.
      </p>

      <div className="mt-8 flex gap-2 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {tab === "shelters" &&
          (shelters === null ? (
            <p className="text-neutral-500">Loading shelters…</p>
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
    </main>
  );
}
