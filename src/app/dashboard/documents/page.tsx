import { requireContext } from "@/lib/queries/auth";
import { getDocuments, getDocumentLinkMap } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { UploadDocument } from "@/components/documents/upload-document";
import { statusFromDate } from "@/lib/status";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const { rows, count } = await getDocuments(company.id, {
    search: sp.q,
    includeArchived,
    page,
    pageSize: PAGE_SIZE,
  });
  const links = await getDocumentLinkMap(company.id, rows);

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Pièces justificatives et documents de conformité."
        action={
          <AddPanel title="Ajouter un document">
            <UploadDocument companyId={company.id} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/documents" search={sp.q} includeArchived={includeArchived} />

      <ListView
        rows={rows}
        getKey={(d) => d.id}
        href={(d) => `/dashboard/documents/${d.id}`}
        empty="Aucun document."
        columns={[
          { header: "Titre", cell: (d) => <span className="font-medium">{d.title}</span> },
          { header: "Type", cell: (d) => d.document_type ?? "—" },
          { header: "Entité liée", cell: (d) => links.get(d.id) ?? "—" },
          { header: "Expiration", cell: (d) => <span className="inline-flex items-center gap-2">{formatDate(d.expiration_date)}<StatusBadge status={statusFromDate(d.expiration_date)} /></span> },
          { header: "Ajouté le", cell: (d) => formatDate(d.created_at) },
        ]}
        card={(d) => ({
          title: d.title,
          badge: <StatusBadge status={statusFromDate(d.expiration_date)} />,
          fields: [
            { label: "Entité liée", value: links.get(d.id) ?? "—" },
            { label: "Expiration", value: formatDate(d.expiration_date) },
          ],
        })}
        actions={(d) => (
          <>
            {d.file_url ? (
              <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">Ouvrir</Button>
              </a>
            ) : null}
            <ArchiveButton table="documents" id={d.id} archived={d.is_archived} />
          </>
        )}
      />

      <Pagination
        basePath="/dashboard/documents"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, archived: sp.archived }}
      />
    </div>
  );
}
