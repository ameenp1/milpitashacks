"use client";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Tone = "error" | "info" | "success";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

const ToastCtx = createContext<{
  showToast: (message: string, tone?: Tone) => void;
}>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

const toneStyles: Record<Tone, string> = {
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-neutral-200 bg-white text-neutral-900",
  success: "border-green-200 bg-green-50 text-green-900",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, tone: Tone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      tone === "error" ? 9000 : 4500,
    );
  }, []);

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto w-full max-w-md rounded-xl border px-4 py-3 text-sm shadow-sm ${toneStyles[t.tone]}`}
          >
            <p>{t.message}</p>
            {t.tone === "error" && (
              <p className="mt-1 text-xs text-red-700">
                Need a hand? Ask a county worker, or call 2-1-1 for help.
              </p>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
