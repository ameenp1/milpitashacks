"use client";
import { getFormDef, getGroup } from "@/lib/data";

// Lists the tracked-change answers on the active form with Approve / Reject and
// an Approve-all button. Approving accepts the change (turns it black in the
// preview + plain text on export); rejecting clears the answer to re-ask it.
export function ApprovalPanel({
  formId,
  answers,
  approved,
  onApprove,
  onApproveAll,
  onReject,
  t,
}: {
  formId: string;
  answers: Record<string, string>;
  approved: string[];
  onApprove: (group: string) => void;
  onApproveAll: (groups: string[]) => void;
  onReject: (group: string) => void;
  t: (s: string) => string;
}) {
  const def = getFormDef(formId);
  if (!def) return null;
  const groupIds = [...new Set(def.fields.map((f) => f.group))].filter((g) =>
    (answers[g] ?? "").trim(),
  );
  const ap = new Set(approved);
  const pending = groupIds.filter((g) => !ap.has(g));

  if (groupIds.length === 0) {
    return (
      <p className="text-sm text-neutral-400">
        {t("Answers will appear here as you go.")}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800">
          {t("Changes to approve")}{" "}
          <span className="text-neutral-400">({pending.length})</span>
        </h3>
        {pending.length > 0 && (
          <button
            type="button"
            onClick={() => onApproveAll(groupIds)}
            className="rounded-lg bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700"
          >
            {t("Approve all")}
          </button>
        )}
      </div>
      <ul className="space-y-1.5">
        {groupIds.map((g) => {
          const isAp = ap.has(g);
          return (
            <li
              key={g}
              className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-xs text-neutral-500">
                  {t(getGroup(g)?.question ?? g)}
                </div>
                <div className="truncate text-sm text-neutral-900">
                  {answers[g]}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {isAp ? (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    {t("Approved")}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onApprove(g)}
                      aria-label={t("Approve")}
                      className="rounded-lg border border-green-200 px-2 py-1 text-xs text-green-700 hover:bg-green-50"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject(g)}
                      aria-label={t("Reject")}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
