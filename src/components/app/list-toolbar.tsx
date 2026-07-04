import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <form method="get" action={basePath} className="mb-4 flex flex-wrap items-end gap-2">
      <div className="w-full sm:w-64">
        <Input name="q" defaultValue={search ?? ""} placeholder="Rechercher…" />
      </div>
      {children}
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="archived" value="1" defaultChecked={includeArchived} />
        Voir les archivés
      </label>
      <Button type="submit" variant="outline" size="sm">
        Filtrer
      </Button>
    </form>
  );
}
