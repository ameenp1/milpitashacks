"use client";
import { ToastProvider } from "./Toast";
import { I18nProvider } from "./I18nProvider";
import { ApplicationSync } from "./ApplicationSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <I18nProvider>
        <ApplicationSync />
        {children}
      </I18nProvider>
    </ToastProvider>
  );
}
