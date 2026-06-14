"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listShelters, loginShelter } from "@/lib/shelters/store";
import type { Shelter, County } from "@/lib/shelters/types";
import { useToast } from "@/components/Toast";
import { BrandLogo } from "@/components/BrandLogo";

type PublicShelter = Omit<Shelter, "password">;

export default function SheltersDirectory() {
  const router = useRouter();
  const { showToast } = useToast();
  const [shelters, setShelters] = useState<PublicShelter[] | null>(null);
  const [selected, setSelected] = useState<PublicShelter | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listShelters()
      .then(setShelters)
      .catch(() => {
        showToast("Could not load the shelter directory.", "error");
        setShelters([]);
      });
  }, [showToast]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      const ok = await loginShelter(selected.id, password);
      if (ok) {
        sessionStorage.setItem(`shelter-auth-${selected.id}`, "1");
        router.push(`/shelters/${selected.id}`);
      } else {
        showToast("Incorrect code for this shelter.", "error");
      }
    } catch {
      showToast("Login failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  const counties: County[] = ["Santa Clara", "San Francisco"];

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/" className="inline-block text-sm text-neutral-400 hover:text-neutral-700">
          ← Back
        </Link>
        <BrandLogo compact />
      </div>

      <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
        Shelter staff login
      </h1>
      <p className="mt-3 text-neutral-600">
        Find your shelter in the directory, then enter the code we gave you.
      </p>

      {shelters === null ? (
        <p className="mt-10 text-neutral-500">Loading directory…</p>
      ) : (
        <div className="mt-8 space-y-8">
          {counties.map((county) => {
            const list = shelters.filter((s) => s.county === county);
            if (list.length === 0) return null;
            return (
              <section key={county}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  {county} County
                </h2>
                <div className="space-y-3">
                  {list.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-xl border p-4 transition ${
                        selected?.id === s.id
                          ? "border-neutral-900 bg-neutral-50"
                          : "border-neutral-300 hover:border-neutral-500"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(selected?.id === s.id ? null : s);
                          setPassword("");
                        }}
                        className="flex w-full items-start justify-between text-left"
                      >
                        <span>
                          <span className="block text-lg font-medium text-neutral-900">
                            {s.name}
                          </span>
                          <span className="block text-sm text-neutral-500">
                            {s.address} · {s.capacity} beds
                          </span>
                        </span>
                        <span className="ml-4 mt-1 text-neutral-400">
                          {selected?.id === s.id ? "▲" : "▼"}
                        </span>
                      </button>

                      {selected?.id === s.id && (
                        <form onSubmit={submit} className="mt-4 flex flex-wrap items-center gap-3">
                          <input
                            type="password"
                            autoFocus
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Shelter code"
                            className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 outline-none focus:border-neutral-900"
                          />
                          <button
                            type="submit"
                            disabled={busy || !password}
                            className="rounded-lg bg-neutral-900 px-6 py-2.5 font-medium text-white transition hover:bg-neutral-700 disabled:opacity-40"
                          >
                            {busy ? "Checking…" : "Log in"}
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
