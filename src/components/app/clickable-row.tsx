"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Ligne de tableau cliquable : navigue vers `href` au clic (curseur pointer +
 * survol). Les vrais liens/boutons imbriqués restent accessibles au clavier ;
 * enveloppez les actions (archiver…) dans <StopClick> pour ne pas déclencher
 * la navigation de la ligne. Cmd/Ctrl-clic ouvre dans un nouvel onglet.
 */
export function ClickableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={(e) => {
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey) {
          window.open(href, "_blank");
          return;
        }
        router.push(href);
      }}
      className={cn(
        "cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted",
        className
      )}
    >
      {children}
    </tr>
  );
}

/** Empêche un clic (boutons d'action…) de propager vers la ligne cliquable. */
export function StopClick({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}
