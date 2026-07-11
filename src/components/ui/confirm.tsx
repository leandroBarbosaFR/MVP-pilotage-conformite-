"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { WarningIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Remplace `window.confirm` par une boîte de dialogue stylée. Retourne une
 * promesse résolue à `true` (Confirmer) ou `false` (Annuler / Échap / clic
 * extérieur). Hors provider, retombe sur le `confirm` natif.
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  return (
    ctx ??
    (async (opts) =>
      typeof window !== "undefined" ? window.confirm(opts.message) : false)
  );
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const [mounted, setMounted] = useState(false);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  useEffect(() => setMounted(true), []);

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setState(options);
      }),
    []
  );

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setState(null);
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle(false);
      if (e.key === "Enter") settle(true);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [state, settle]);

  const danger = state?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {mounted && state
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) settle(false);
              }}
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-label={state.title ?? "Confirmation"}
                className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-xl"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={
                      danger
                        ? "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-danger/10 text-status-danger"
                        : "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
                    }
                  >
                    {danger ? <TrashIcon size={18} /> : <WarningIcon size={18} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {state.title ? (
                      <h3 className="text-sm font-semibold text-foreground">{state.title}</h3>
                    ) : null}
                    <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => settle(false)}>
                    {state.cancelLabel ?? "Annuler"}
                  </Button>
                  <Button
                    variant={danger ? "danger" : "primary"}
                    size="sm"
                    autoFocus
                    onClick={() => settle(true)}
                  >
                    {state.confirmLabel ?? "Confirmer"}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </ConfirmContext.Provider>
  );
}
