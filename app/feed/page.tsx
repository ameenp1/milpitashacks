"use client";
import { useEffect, useState } from "react";
import { listPosts, listShelters } from "@/lib/shelters/store";
import { CalendarIcon } from "@/components/icons";
import type { Post, Shelter } from "@/lib/shelters/types";

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
    <span className="rounded bg-brand-tint px-2.5 py-1 text-xs font-semibold text-brand">
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
    <main>
      <section className="border-b border-line bg-brand-tint">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">
            Community
          </h1>
          <p className="mt-3 text-ink/80">
            Events and announcements from shelters across both counties.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex gap-1 border-b border-line">
          {([
            { id: "events", label: "Events" },
            { id: "shelters", label: "Shelters" },
          ] as const).map((t) => (
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

        {tab === "events" && (
          <div className="mt-6 space-y-4">
            {posts === null ? (
              <p className="text-ink/55">Loading…</p>
            ) : posts.length === 0 ? (
              <p className="text-ink/55">No posts yet.</p>
            ) : (
              posts.map((p) => (
                <article key={p.id} className="rounded border border-line bg-white p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-navy">{p.shelterName}</span>
                    <span className="text-xs text-ink/45">{timeAgo(p.createdAt)}</span>
                  </div>
                  <div className="text-xs text-ink/45">{p.county} County</div>

                  {p.eventDate && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded bg-brand-tint px-2.5 py-1 text-sm font-bold text-brand">
                      <CalendarIcon className="h-4 w-4" />
                      {fmtDate(p.eventDate)}
                    </div>
                  )}

                  <h2 className="mt-3 text-lg font-bold text-navy">{p.title}</h2>
                  <p className="mt-1 whitespace-pre-wrap text-ink/75">{p.body}</p>
                </article>
              ))
            )}
          </div>
        )}

        {tab === "shelters" && (
          <div className="mt-6 space-y-4">
            {shelters === null ? (
              <p className="text-ink/55">Loading…</p>
            ) : (
              shelters.map((s) => (
                <article key={s.id} className="rounded border border-line bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-navy">{s.name}</h2>
                    <span className="text-xs text-ink/45">{s.county} County</span>
                  </div>
                  <p className="mt-2 text-ink/75">{s.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.focus.map((f) => (
                      <Chip key={f} label={f} />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-ink/55">
                    {s.address} · {s.capacity} beds
                  </p>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
