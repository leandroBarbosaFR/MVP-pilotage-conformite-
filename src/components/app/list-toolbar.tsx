"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Barre de recherche + filtres pilotée par l'URL (GET, filtres côté serveur).
 * Filtrage automatique : les selects et la case "archivés" appliquent
 * immédiatement ; la recherche s'applique après une courte pause de frappe.
 */
export function ListToolbar({
  basePath,
  search,
  includeArchived,
  children,
}: {
  basePath: string;
  search?: string;
  includeArchived?: boolean;
  children?: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submit = () => formRef.current?.requestSubmit();

  // Selects + cases à cocher : application immédiate
  const onChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "SELECT" || (t as HTMLInputElement).type === "checkbox") submit();
  };

  // Recherche : application différée (anti-rebond)
  const onSearchInput = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(submit, 450);
  };

  return (
    <form
      ref={formRef}
      method="get"
      action={basePath}
      onChange={onChange}
      className="mb-4 flex flex-wrap items-center gap-2"
    >
      <div className="w-full sm:w-64">
        <Input name="q" defaultValue={search ?? ""} placeholder="Rechercher…" onInput={onSearchInput} />
      </div>
      {children}
      <label
        className={cn(
          "flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors",
          includeArchived
            ? "border-accent/40 bg-accent/10 text-foreground"
            : "border-border bg-surface text-muted-foreground hover:bg-muted"
        )}
      >
        <input
          type="checkbox"
          name="archived"
          value="1"
          defaultChecked={includeArchived}
          className="h-4 w-4 rounded-sm border-input accent-accent"
        />
        Voir les archivés
      </label>
      {/* Repli sans JavaScript */}
      <noscript>
        <button type="submit" className="h-9 rounded-md border border-border bg-surface px-4 text-sm">
          Filtrer
        </button>
      </noscript>
    </form>
  );
}
