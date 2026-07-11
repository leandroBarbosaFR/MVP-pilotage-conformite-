"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XIcon as X } from "@phosphor-icons/react/dist/ssr";

/** Expose une fonction `close` aux formulaires enfants (voir `SubmitButton`). */
export const ModalContext = createContext<{ close: () => void } | null>(null);

export function useModalClose() {
  return useContext(ModalContext)?.close ?? (() => {});
}

/**
 * Modale centrée, contrôlée : fond flouté, fermeture via la croix, la touche
 * Échap ou un clic sur l'arrière-plan. Rendue dans un portail pour éviter tout
 * rognage par les conteneurs à `overflow`.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative my-8 w-full max-w-2xl rounded-md border border-border bg-background shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4">
          <ModalContext.Provider value={{ close: onClose }}>{children}</ModalContext.Provider>
        </div>
      </div>
    </div>,
    document.body
  );
}
