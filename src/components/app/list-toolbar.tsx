import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Barre de recherche + filtres pilotée par l'URL (GET, filtres côté serveur). */
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
  return (
    <form method="get" action={basePath} className="mb-4 flex flex-wrap items-center gap-2">
      <div className="w-full sm:w-64">
        <Input name="q" defaultValue={search ?? ""} placeholder="Rechercher…" />
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
      <Button type="submit" size="sm" className="h-9 rounded-md px-4">
        Filtrer
      </Button>
    </form>
  );
}
