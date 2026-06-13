"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getShelter,
  getParticipants,
  getApplicants,
} from "@/lib/shelters/store";
import type { Shelter, Participant, Applicant } from "@/lib/shelters/types";

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
  const [shelter, setShelter] = useState<PublicShelter | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(`shelter-auth-${shelterId}`) !== "1") {
      router.replace("/shelters");
      return;
    }
    Promise.all([
      getShelter(shelterId),
      getParticipants(shelterId),
      getApplicants(shelterId),
    ])
      .then(([s, p, a]) => {
        if (!s) {
          router.replace("/shelters");
          return;
        }
        setShelter(s);
        setParticipants(p);
        setApplicants(a);
      })
      .finally(() => setLoading(false));
  }, [shelterId, router]);

  function logout() {
    sessionStorage.removeItem(`shelter-auth-${shelterId}`);
    router.replace("/shelters");
  }

  if (loading) {
    return <main className="mx-auto max-w-4xl px-6 py-12 text-neutral-500">Loading…</main>;
  }
  if (!shelter) return null;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium tracking-wide text-neutral-500">
            {shelter.county} County · {shelter.capacity} beds
          </div>
          <h1 className="mt-1 text-3xl font-semibold text-neutral-900 sm:text-4xl">
            {shelter.name}
          </h1>
          <p className="mt-1 text-neutral-500">{shelter.address} · {shelter.phone}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="shrink-0 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:border-neutral-900 hover:text-neutral-900"
        >
          Log out
        </button>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Participants */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">Participants</h2>
            <span className="text-sm text-neutral-500">{participants.length} enrolled</span>
          </div>
          <div className="space-y-3">
            {participants.map((p) => (
              <div key={p.id} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-neutral-900">{p.name}</span>
                  <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800">
                    Bed {p.bedAssignment}
                  </span>
                </div>
                <div className="mt-1 text-sm text-neutral-500">
                  Joined {fmtDate(p.joinedOn)} · Caseworker {p.caseworker}
                </div>
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-sm text-neutral-500">No participants yet.</p>
            )}
          </div>
        </section>

        {/* Applicants */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">Applicants</h2>
            <span className="text-sm text-neutral-500">{applicants.length} in progress</span>
          </div>
          <div className="space-y-3">
            {applicants.map((a) => (
              <div key={a.id} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-neutral-900">{a.name}</span>
                  <span className="text-sm text-neutral-500">Applied {fmtDate(a.appliedOn)}</span>
                </div>
                <div className="mt-1 text-sm text-neutral-500">{a.needs}</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-medium text-neutral-600">
                    {a.progress}%
                  </span>
                </div>
              </div>
            ))}
            {applicants.length === 0 && (
              <p className="text-sm text-neutral-500">No applicants in progress.</p>
            )}
          </div>
        </section>
      </div>

      <Link
        href="/"
        className="mt-12 inline-block text-sm text-neutral-400 hover:text-neutral-700"
      >
        ← Home
      </Link>
    </main>
  );
}
