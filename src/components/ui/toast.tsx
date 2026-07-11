"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone };

const ToastCtx = createContext<{ toast: (message: string, tone?: Tone) => void } | null>(null);

/** Affiche un toast de confirmation. No-op hors du ToastProvider (jamais d'erreur). */
export function useToast() {
  const ctx = useContext(ToastCtx);
  return ctx ?? { toast: () => {} };
}

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, tone: Tone = "success") => {
    const id = ++seq;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto min-w-56 max-w-sm rounded-md border border-border border-l-2 bg-background px-3 py-2 text-sm text-foreground",
              t.tone === "error" ? "border-l-status-danger" : t.tone === "info" ? "border-l-accent" : "border-l-status-ok"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
