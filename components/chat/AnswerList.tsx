"use client";
import { useState } from "react";
import { getFormDef, getGroup } from "@/lib/data";

// Replaces the old approve/reject panel (revisions_2 L5): just the list of
// answers with an inline Edit. Role 3 extends this (e.g. click-on-document edit).
export function AnswerList({
  formId,
  answers,
  t,
  onEdit,
}: {
  formId: string;
  answers: Record<string, string>;
  t: (s: string) => string;
  onEdit: (group: string, value: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [reveal, setReveal] = useState(false);

  const def = getFormDef(formId);
  if (!def) return null;
  const groupIds = [...new Set(def.fields.map((f) => f.group))].filter((g) =>
    (answers[g] ?? "").trim(),
  );
  if (!groupIds.length) {
    return (
      <p className="text-sm text-neutral-400">
        {t("Answers will appear here as you go.")}
      </p>
    );
  }

  function commit(g: string) {
    onEdit(g, draft);
    setEditing(null);
  }

  return (
    <ul className="space-y-1.5">
      {groupIds.map((g) => {
        const val = answers[g];
        const isEditing = editing === g;
        return (
          <li
            key={g}
            className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs text-neutral-500">
                {t(getGroup(g)?.question ?? g)}
              </div>
              {isEditing ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commit(g)}
                  className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-neutral-900"
                />
              ) : (
                <div className="truncate text-sm text-neutral-900">
                  {g === "ssn" && !reveal ? val.replace(/[0-9]/g, "•") : val}
                  {g === "ssn" && (
                    <button
                      type="button"
                      onClick={() => setReveal((r) => !r)}
                      aria-label={reveal ? "Hide" : "Show"}
                      className="ml-2 text-neutral-400 hover:text-neutral-700"
                    >
                      {reveal ? "🙈" : "👁"}
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => (isEditing ? commit(g) : (setEditing(g), setDraft(val)))}
              className="shrink-0 rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              {isEditing ? t("Save") : t("Edit")}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
