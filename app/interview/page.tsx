"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PROFILE_SCHEMA } from "@/lib/data";
import { useAppState, setAnswer } from "@/lib/profile";
import { QuestionCard } from "@/components/QuestionCard";
import type { QuestionGroup } from "@/lib/types";

export default function InterviewPage() {
  const router = useRouter();
  const { profile } = useAppState();
  const answers = profile.answers;
  const [idx, setIdx] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  const applies = (g: QuestionGroup) =>
    !g.dependsOn || answers[g.dependsOn.group] === g.dependsOn.equals;

  const firstFrom = useMemo(
    () => (start: number) => {
      for (let i = start; i < PROFILE_SCHEMA.length; i++) {
        if (applies(PROFILE_SCHEMA[i])) return i;
      }
      return PROFILE_SCHEMA.length;
    },
    // recompute when answers change (dependsOn)
    [answers],
  );

  const curIdx = firstFrom(idx);
  const done = curIdx >= PROFILE_SCHEMA.length;
  const group = done ? null : PROFILE_SCHEMA[curIdx];

  const applicable = PROFILE_SCHEMA.filter(applies);
  const answeredCount = applicable.filter((g) => answers[g.id]?.trim()).length;
  const total = applicable.length;
  const pct = Math.round((answeredCount / total) * 100);

  function advance() {
    setIdx(firstFrom(curIdx + 1));
  }
  function back() {
    for (let i = curIdx - 1; i >= 0; i--) {
      if (applies(PROFILE_SCHEMA[i])) {
        setIdx(i);
        return;
      }
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <header className="mb-8">
        <div className="mb-3 flex items-center justify-between text-sm text-neutral-500">
          <span>
            Question {Math.min(answeredCount + 1, total)} of {total}
          </span>
          <button
            type="button"
            onClick={() => setSoundOn((s) => !s)}
            className="rounded-full border border-neutral-200 px-3 py-1 hover:bg-neutral-50"
          >
            {soundOn ? "🔊 Sound on" : "🔇 Sound off"}
          </button>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full bg-neutral-900 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      {group ? (
        <>
          <QuestionCard
            key={group.id}
            group={group}
            value={answers[group.id] ?? ""}
            language={profile.language}
            soundOn={soundOn}
            onAnswer={(v) => {
              setAnswer(group.id, v);
              advance();
            }}
            onSkip={advance}
          />
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              disabled={curIdx === 0}
              className="text-sm text-neutral-400 hover:text-neutral-700 disabled:opacity-40"
            >
              ← Back
            </button>
            <Link
              href="/forms"
              className="text-sm text-neutral-400 underline-offset-2 hover:text-neutral-700 hover:underline"
            >
              Skip to my forms →
            </Link>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-neutral-200 p-8 text-center">
          <h2 className="text-2xl font-semibold">You're all set.</h2>
          <p className="mt-2 text-neutral-500">
            We saved your answers. Next, we'll use them to fill out your forms.
          </p>
          <button
            type="button"
            onClick={() => router.push("/forms")}
            className="mt-6 rounded-xl bg-neutral-900 px-8 py-4 text-lg font-medium text-white hover:bg-neutral-700"
          >
            See my forms
          </button>
        </div>
      )}
    </main>
  );
}
