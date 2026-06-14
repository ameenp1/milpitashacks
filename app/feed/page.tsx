"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listPosts, listShelters } from "@/lib/shelters/store";
import type { Post, Shelter } from "@/lib/shelters/types";
import { BrandLogo } from "@/components/BrandLogo";

type Tab = "events" | "shelters";
type PublicShelter = Omit<Shelter, "password">;

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeAgo(ms: number): string {
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
      {label}
    </span>
  );
}

export default function FeedPage() {
  const [tab, setTab] = useState<Tab>("events");
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [shelters, setShelters] = useState<PublicShelter[] | null>(null);

  useEffect(() => {
    listPosts().then(setPosts).catch(() => setPosts([]));
    listShelters().then(setShelters).catch(() => setShelters([]));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/" className="inline-block text-sm text-neutral-400 hover:text-neutral-700">
          ← Back
        </Link>
        <BrandLogo compact />
      </div>

      <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">Community</h1>
      <p className="mt-3 text-neutral-600">
        Events and announcements from shelters across both counties.
      </p>

      <div className="mt-8 flex gap-2 border-b border-neutral-200">
        {([
          { id: "events", label: "Events" },
          { id: "shelters", label: "Shelters" },
        ] as const).map((t) => (
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
            {t.label}
          </button>
        ))}
      </div>

      {tab === "events" && (
        <div className="mt-6 space-y-4">
          {posts === null ? (
            <p className="text-neutral-500">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-neutral-500">No posts yet.</p>
          ) : (
            posts.map((p) => (
              <article key={p.id} className="rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-900">{p.shelterName}</span>
                  <span className="text-xs text-neutral-400">{timeAgo(p.createdAt)}</span>
                </div>
                <div className="text-xs text-neutral-400">{p.county} County</div>

                {p.eventDate && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-800">
                    📅 {fmtDate(p.eventDate)}
                  </div>
                )}

                <h2 className="mt-3 text-lg font-semibold text-neutral-900">{p.title}</h2>
                <p className="mt-1 whitespace-pre-wrap text-neutral-600">{p.body}</p>
              </article>
            ))
          )}
        </div>
      )}

      {tab === "shelters" && (
        <div className="mt-6 space-y-4">
          {shelters === null ? (
            <p className="text-neutral-500">Loading…</p>
          ) : (
            shelters.map((s) => (
              <article key={s.id} className="rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neutral-900">{s.name}</h2>
                  <span className="text-xs text-neutral-400">{s.county} County</span>
                </div>
                <p className="mt-2 text-neutral-600">{s.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.focus.map((f) => (
                    <Chip key={f} label={f} />
                  ))}
                </div>
                <p className="mt-3 text-sm text-neutral-500">
                  {s.address} · {s.capacity} beds
                </p>
              </article>
            ))
          )}
        </div>
      )}
    </main>
  );
}
