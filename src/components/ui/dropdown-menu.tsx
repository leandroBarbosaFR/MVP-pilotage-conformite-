"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { DotsThreeVerticalIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Menu d'actions déclenché par une icône « ⋮ ». Le panneau est rendu dans un
 * portail et positionné en `fixed` sous le bouton, pour ne jamais être rogné
 * par le conteneur de tableau (`overflow`). Se ferme au clic extérieur, à
 * Échap, ou au défilement.
 */
export function RowMenu({
  children,
  label = "Actions",
}: {
  children: (close: () => void) => React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onScroll = () => close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <DotsThreeVerticalIcon size={18} weight="bold" />
      </button>
      {open && coords
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ position: "fixed", top: coords.top, right: coords.right }}
              className="z-[60] min-w-44 overflow-hidden rounded-md border border-border bg-background py-1 shadow-lg"
            >
              {children(close)}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export function MenuItem({
  children,
  icon,
  onClick,
  href,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  const cls = cn(
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50",
    danger ? "text-status-danger" : "text-foreground"
  );
  if (href) {
    return (
      <Link href={href} role="menuitem" className={cls}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button type="button" role="menuitem" onClick={onClick} disabled={disabled} className={cls}>
      {icon}
      {children}
    </button>
  );
}
