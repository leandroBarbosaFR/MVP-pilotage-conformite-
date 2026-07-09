import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import {
  getObligation,
  getLinkedDocuments,
  getObligationActions,
} from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField, DetailSection } from "@/components/app/detail-field";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/app/clickable-row";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CATEGORY_LABELS,
  FREQUENCY_LABELS,
  PRIORITY_LABELS,
  OBLIGATION_STATUS_LABELS,
  ACTION_STATUS_LABELS,
  complianceFromObligationStatus,
  statusFromDate,
} from "@/lib/status";
import { formatDate } from "@/lib/utils";

export default async function ObligationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireContext();

  const obligation = await getObligation(id);
  if (!obligation) notFound();

  const [documents, actions] = await Promise.all([
    getLinkedDocuments("obligation_id", id),
    getObligationActions(id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/obligations"
        backLabel="Retour aux contrôles réglementaires"
        title={obligation.title}
        action={
          <ArchiveButton table="obligations" id={obligation.id} archived={obligation.is_archived} />
        }
      />

      <DetailGrid>
        <DetailField label="Titre" value={obligation.title} />
        <DetailField label="Catégorie" value={CATEGORY_LABELS[obligation.category]} />
        <DetailField label="Description" value={obligation.description} />
        <DetailField
          label="Échéance"
          value={
            <span className="inline-flex items-center gap-2">
              {formatDate(obligation.due_date)}
              <StatusBadge status={statusFromDate(obligation.due_date)} />
            </span>
          }
        />
        <DetailField label="Fréquence" value={FREQUENCY_LABELS[obligation.frequency]} />
        <DetailField label="Priorité" value={PRIORITY_LABELS[obligation.priority]} />
        <DetailField
          label="Statut"
          value={
            <StatusBadge
              status={complianceFromObligationStatus(obligation.status)}
              label={OBLIGATION_STATUS_LABELS[obligation.status]}
            />
          }
        />
        <DetailField label="Commentaires" value={obligation.comments} />
        <DetailField label="Créée le" value={formatDate(obligation.created_at)} />
        <DetailField label="Mise à jour" value={formatDate(obligation.updated_at)} />
      </DetailGrid>

      <DetailSection title="Documents liés">
        <Table>
          <THead>
            <TR>
              <TH>Titre</TH>
              <TH>Type</TH>
              <TH>Expiration</TH>
            </TR>
          </THead>
          <tbody>
            {documents.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucun élément." />
            ) : (
              documents.map((d) => (
                <ClickableRow key={d.id} href={`/dashboard/documents/${d.id}`}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/documents/${d.id}`} className="hover:underline">
                      {d.title}
                    </Link>
                  </TD>
                  <TD>{d.document_type ?? "—"}</TD>
                  <TD>{formatDate(d.expiration_date)}</TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      <DetailSection title="Actions liées">
        <Table>
          <THead>
            <TR>
              <TH>Titre</TH>
              <TH>Statut</TH>
              <TH>Échéance</TH>
            </TR>
          </THead>
          <tbody>
            {actions.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucun élément." />
            ) : (
              actions.map((a) => (
                <ClickableRow key={a.id} href={`/dashboard/actions/${a.id}`}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/actions/${a.id}`} className="hover:underline">
                      {a.title}
                    </Link>
                  </TD>
                  <TD>{ACTION_STATUS_LABELS[a.status]}</TD>
                  <TD>{formatDate(a.due_date)}</TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>
    </div>
  );
}
