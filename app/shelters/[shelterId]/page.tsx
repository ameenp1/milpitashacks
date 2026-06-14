"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarIcon } from "@/components/icons";
import {
  getShelter,
  getParticipants,
  getApplicants,
  listPosts,
  createPost,
} from "@/lib/shelters/store";
import type { Shelter, Participant, Applicant, Post } from "@/lib/shelters/types";
import { useToast } from "@/components/Toast";

type PublicShelter = Omit<Shelter, "password">;

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ShelterDashboard() {
  const { shelterId } = useParams<{ shelterId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [shelter, setShelter] = useState<PublicShelter | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(`shelter-auth-${shelterId}`) !== "1") {
      router.replace("/shelters");
      return;
    }
    Promise.all([
      getShelter(shelterId),
      getParticipants(shelterId),
      getApplicants(shelterId),
      listPosts(),
    ])
      .then(([s, p, a, allPosts]) => {
        if (!s) {
          router.replace("/shelters");
          return;
        }
        setShelter(s);
        setParticipants(p);
        setApplicants(a);
        setPosts(allPosts.filter((post) => post.shelterId === shelterId));
      })
      .finally(() => setLoading(false));
  }, [shelterId, router]);

  function logout() {
    sessionStorage.removeItem(`shelter-auth-${shelterId}`);
    router.replace("/shelters");
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!shelter || !title.trim() || !body.trim()) return;
    setPosting(true);
    try {
      const post = await createPost(shelter, {
        title,
        body,
        eventDate: eventDate || undefined,
      });
      setPosts((prev) => [post, ...prev]);
      setTitle("");
      setBody("");
      setEventDate("");
      showToast("Posted to the community feed.", "success");
    } catch {
      showToast("Could not publish your post.", "error");
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-4xl px-6 py-12 text-neutral-500">Loading…</main>;
  }
  if (!shelter) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-brand">
            {shelter.county} County · {shelter.capacity} beds
          </div>
          <h1 className="mt-1 text-3xl font-bold text-navy sm:text-4xl">
            {shelter.name}
          </h1>
          <p className="mt-1 text-ink/60">{shelter.address} · {shelter.phone}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="shrink-0 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink/70 hover:border-brand hover:text-ink"
        >
          Log out
        </button>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Participants */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-navy">Participants</h2>
            <span className="text-sm text-ink/55">{participants.length} enrolled</span>
          </div>
          <div className="space-y-3">
            {participants.map((p) => (
              <div key={p.id} className="rounded-lg border border-line bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-navy">{p.name}</span>
                  <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800">
                    Bed {p.bedAssignment}
                  </span>
                </div>
                <div className="mt-1 text-sm text-ink/55">
                  Joined {fmtDate(p.joinedOn)} · Caseworker {p.caseworker}
                </div>
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-sm text-ink/55">No participants yet.</p>
            )}
          </div>
        </section>

        {/* Applicants */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-navy">Applicants</h2>
            <span className="text-sm text-ink/55">{applicants.length} in progress</span>
          </div>
          <div className="space-y-3">
            {applicants.map((a) => (
              <div key={a.id} className="rounded-lg border border-line bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-navy">{a.name}</span>
                  <span className="text-sm text-ink/55">Applied {fmtDate(a.appliedOn)}</span>
                </div>
                <div className="mt-1 text-sm text-ink/55">{a.needs}</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-medium text-ink/70">
                    {a.progress}%
                  </span>
                </div>
              </div>
            ))}
            {applicants.length === 0 && (
              <p className="text-sm text-ink/55">No applicants in progress.</p>
            )}
          </div>
        </section>
      </div>

      {/* Community feed composer */}
      <section className="mt-12 border-t border-line pt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-navy">Community feed</h2>
          <Link href="/feed" className="text-sm font-semibold text-link hover:underline">
            View public feed →
          </Link>
        </div>
        <p className="mb-4 text-sm text-ink/60">
          Post an event or announcement. Everyone — residents and other shelters — can see it.
        </p>

        <form onSubmit={submitPost} className="rounded-lg border border-line bg-white p-5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Free job fair on Saturday)"
            className="w-full rounded-md border border-line px-4 py-2.5 text-ink outline-none focus:border-brand"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Details — what, where, who can come…"
            rows={3}
            className="mt-3 w-full resize-y rounded-md border border-line px-4 py-2.5 text-ink outline-none focus:border-brand"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-ink/70">
              Event date (optional)
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="rounded-md border border-line px-3 py-2 text-ink outline-none focus:border-brand"
              />
            </label>
            <button
              type="submit"
              disabled={posting || !title.trim() || !body.trim()}
              className="ml-auto rounded-md bg-brand px-6 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>

        {posts.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">
              Your posts
            </h3>
            <div className="space-y-3">
              {posts.map((p) => (
                <div key={p.id} className="rounded border border-line bg-white p-4">
                  {p.eventDate && (
                    <div className="mb-1 flex items-center gap-1.5 text-sm font-bold text-brand">
                      <CalendarIcon className="h-4 w-4" />
                      {fmtDate(p.eventDate)}
                    </div>
                  )}
                  <div className="font-bold text-navy">{p.title}</div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink/70">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Link
        href="/"
        className="mt-12 inline-block text-sm text-ink/45 hover:text-ink"
      >
        ← Home
      </Link>
    </main>
  );
}
