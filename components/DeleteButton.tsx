"use client";
import { useRouter } from "next/navigation";
import { clearAll } from "@/lib/profile";
import { useToast } from "./Toast";

export function DeleteButton({
  label = "Delete my information",
}: {
  label?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  function onClick() {
    const ok = window.confirm(
      "This permanently erases all of your answers from this device. Continue?",
    );
    if (!ok) return;
    clearAll();
    showToast("Your information was deleted from this device.", "success");
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
    >
      {label}
    </button>
  );
}
