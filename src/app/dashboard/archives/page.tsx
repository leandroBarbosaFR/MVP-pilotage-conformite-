import { requireContext } from "@/lib/queries/auth";
import { getArchivedItems, type ArchivedItem } from "@/lib/queries/entities";
import { ArchiveButton } from "@/components/app/archive-button";
import { ListView } from "@/components/app/list-view";
import { formatDate } from "@/lib/utils";

export default async function ArchivesPage() {
  const { company } = await requireContext();
  const items = await getArchivedItems(company.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Archives</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Éléments archivés — masqués des listes, restaurables à tout moment.
        </p>
      </div>

      <ListView<ArchivedItem>
        rows={items}
        getKey={(i) => `${i.table}-${i.id}`}
        empty="Aucun élément archivé."
        columns={[
          { header: "Élément", cell: (i) => <span className="font-medium">{i.label}</span> },
          { header: "Type", cell: (i) => i.type },
          { header: "Archivé le", cell: (i) => formatDate(i.archived_at) },
          { header: "Archivé par", cell: (i) => i.archived_by ?? "—" },
        ]}
        card={(i) => ({
          title: i.label,
          fields: [
            { label: "Type", value: i.type },
            { label: "Archivé le", value: formatDate(i.archived_at) },
          ],
        })}
        actions={(i) => <ArchiveButton table={i.table} id={i.id} archived={true} />}
      />
    </div>
  );
}
