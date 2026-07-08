import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import { getDocument, getDocumentLinkMap, getProfiles } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField } from "@/components/app/detail-field";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DocumentAiActions } from "@/components/documents/document-ai-actions";
import { statusFromDate } from "@/lib/status";
import { formatDate } from "@/lib/utils";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requireContext();

  const document = await getDocument(id);
  if (!document) notFound();

  const [links, profiles] = await Promise.all([
    getDocumentLinkMap(company.id, [document]),
    getProfiles(company.id),
  ]);
  const link = links.get(document.id);
  const responsible = document.responsible_id
    ? profiles.find((p) => p.id === document.responsible_id)
    : null;
  const responsibleName = responsible
    ? [responsible.first_name, responsible.last_name].filter(Boolean).join(" ") || responsible.email
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={document.title}
        action={
          <>
            {document.file_url ? (
              <a
                href={document.file_url}
                target="_blank"
                rel="noopener"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Ouvrir le fichier
              </a>
            ) : null}
            <ArchiveButton table="documents" id={document.id} archived={document.is_archived} />
          </>
        }
      />

      <DetailGrid>
        <DetailField label="Titre" value={document.title} />
        <DetailField label="Type" value={document.document_type} />
        <DetailField
          label="Expiration"
          value={
            <span className="inline-flex items-center gap-2">
              {formatDate(document.expiration_date)}
              <StatusBadge status={statusFromDate(document.expiration_date)} />
            </span>
          }
        />
        <DetailField label="Module" value={link && link.module !== "—" ? link.module : null} />
        <DetailField label="Entité liée" value={link && link.label !== "—" ? link.label : null} />
        <DetailField label="Responsable" value={responsibleName} />
        <DetailField label="Ajouté le" value={formatDate(document.created_at)} />
      </DetailGrid>

      <Card>
        <CardHeader>
          <CardTitle>Actions sur le document</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentAiActions />
        </CardContent>
      </Card>
    </div>
  );
}
