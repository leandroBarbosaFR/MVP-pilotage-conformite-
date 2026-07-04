import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import { getAction } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField } from "@/components/app/detail-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ACTION_STATUS_LABELS,
  PRIORITY_LABELS,
  complianceFromActionStatus,
  statusFromDate,
} from "@/lib/status";
import { formatDate } from "@/lib/utils";

export default async function ActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireContext();

  const action = await getAction(id);
  if (!action) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={action.title}
        action={<ArchiveButton table="actions" id={action.id} archived={action.is_archived} />}
      />

      <DetailGrid>
        <DetailField label="Titre" value={action.title} />
        <DetailField label="Description" value={action.description} />
        <DetailField
          label="Statut"
          value={
            <StatusBadge
              status={complianceFromActionStatus(action.status)}
              label={ACTION_STATUS_LABELS[action.status]}
            />
          }
        />
        <DetailField label="Priorité" value={PRIORITY_LABELS[action.priority]} />
        <DetailField
          label="Échéance"
          value={
            <span className="inline-flex items-center gap-2">
              {formatDate(action.due_date)}
              <StatusBadge status={statusFromDate(action.due_date)} />
            </span>
          }
        />
        <DetailField label="Commentaire" value={action.comment} />
        <DetailField label="Créée le" value={formatDate(action.created_at)} />
        <DetailField label="Mise à jour" value={formatDate(action.updated_at)} />
      </DetailGrid>
    </div>
  );
}
