import Link from "next/link";
import { requireContext } from "@/lib/queries/auth";
import { getDocuments } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
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

      <Table>
        <THead>
          <TR>
            <TH>Titre</TH>
            <TH>Type</TH>
            <TH>Expiration</TH>
            <TH>Ajouté le</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={5} message="Aucun document." />
          ) : (
            rows.map((d) => (
              <TR key={d.id}>
                <TD className="font-medium">
                  <Link href={`/dashboard/documents/${d.id}`} className="hover:underline">
                    {d.title}
                  </Link>
                </TD>
                <TD>{d.document_type ?? "—"}</TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <span>{formatDate(d.expiration_date)}</span>
                    <StatusBadge status={statusFromDate(d.expiration_date)} />
                  </div>
                </TD>
                <TD>{formatDate(d.created_at)}</TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    {d.file_url ? (
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          Ouvrir
                        </Button>
                      </a>
                    ) : null}
                    <ArchiveButton table="documents" id={d.id} archived={d.is_archived} />
                  </div>
                </TD>
              </TR>
            ))
          )}
        </tbody>
      </Table>

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
