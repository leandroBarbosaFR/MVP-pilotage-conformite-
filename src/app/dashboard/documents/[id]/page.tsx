import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import { getDocument } from "@/lib/queries/entities";
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
  await requireContext();

  const document = await getDocument(id);
  if (!document) notFound();

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
        <DetailField label="Statut" value={document.status} />
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
