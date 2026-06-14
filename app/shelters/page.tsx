"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listShelters, loginShelter } from "@/lib/shelters/store";
import type { Shelter, County } from "@/lib/shelters/types";
import { useToast } from "@/components/Toast";

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
    <main>
      <section className="border-b border-line bg-brand-tint">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            For shelter staff
          </p>
          <h1 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">
            Shelter staff login
          </h1>
          <p className="mt-3 text-ink/70">
            Find your shelter in the directory, then enter the code we gave you.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8">
      {shelters === null ? (
        <p className="text-ink/55">Loading directory…</p>
      ) : (
        <div className="space-y-8">
          {counties.map((county) => {
            const list = shelters.filter((s) => s.county === county);
            if (list.length === 0) return null;
            return (
              <section key={county}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">
                  {county} County
                </h2>
                <div className="space-y-3">
                  {list.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-lg border bg-white p-4 transition ${
                        selected?.id === s.id
                          ? "border-brand ring-1 ring-brand/20"
                          : "border-line hover:border-brand/50"
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
                          <span className="block text-lg font-bold text-navy">
                            {s.name}
                          </span>
                          <span className="block text-sm text-ink/55">
                            {s.address} · {s.capacity} beds
                          </span>
                        </span>
                        <span className="ml-4 mt-1 text-ink/40">
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
                            className="flex-1 rounded-md border border-line px-4 py-2.5 text-ink outline-none focus:border-brand"
                          />
                          <button
                            type="submit"
                            disabled={busy || !password}
                            className="rounded-md bg-brand px-6 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-40"
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
      </div>
    </main>
  );
}
