"use client";
import { ToastProvider } from "./Toast";
import { I18nProvider } from "./I18nProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <I18nProvider>{children}</I18nProvider>
    </ToastProvider>
  );
}
