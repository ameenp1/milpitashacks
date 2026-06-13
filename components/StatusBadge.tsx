import type { FormStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/status";

const styles: Record<FormStatus, string> = {
  not_started: "border-neutral-200 bg-neutral-50 text-neutral-600",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700",
  needs_review: "border-amber-200 bg-amber-50 text-amber-800",
  complete: "border-green-200 bg-green-50 text-green-700",
};
const dot: Record<FormStatus, string> = {
  not_started: "bg-neutral-400",
  in_progress: "bg-blue-500",
  needs_review: "bg-amber-500",
  complete: "bg-green-500",
};

export function StatusBadge({ status }: { status: FormStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
