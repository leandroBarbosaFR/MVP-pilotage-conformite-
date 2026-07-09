import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import { getIncidentDetail } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ArchiveButton } from "@/components/app/archive-button";
import { CreateIncidentCorrectiveActionButton } from "@/components/incidents/create-incident-corrective-action-button";
import { DetailGrid, DetailField, DetailSection } from "@/components/app/detail-field";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/app/clickable-row";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ACTION_STATUS_LABELS,
  PRIORITY_LABELS,
  complianceFromActionStatus,
} from "@/lib/status";
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_STATUS_TONE,
  PRIORITY_TONE,
  RELATED_ENTITY_LABELS,
} from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus, RelatedEntityType } from "@/lib/types/database";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireContext();

  const { incident, siteName, correctiveAction, profileName, relatedName } = await getIncidentDetail(id);
  if (!incident) notFound();

  const pName = (pid: string | null) => (pid ? profileName.get(pid) ?? "—" : "—");
  const relatedLabel = incident.related_entity_type
    ? RELATED_ENTITY_LABELS[incident.related_entity_type as RelatedEntityType] ?? incident.related_entity_type
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/incidents"
        backLabel="Retour aux incidents"
        title={incident.title}
        description={INCIDENT_TYPE_LABELS[incident.type] ?? incident.type}
        action={
          <>
            {!incident.corrective_action_id ? <CreateIncidentCorrectiveActionButton incidentId={incident.id} /> : null}
            <ArchiveButton table="incidents" id={incident.id} archived={incident.is_archived} />
          </>
        }
      />

      <DetailGrid>
        <DetailField label="Type" value={INCIDENT_TYPE_LABELS[incident.type] ?? incident.type} />
        <DetailField
          label="Gravité"
          value={<StatusBadge status={(PRIORITY_TONE[incident.severity] ?? "none") as ComplianceStatus} label={PRIORITY_LABELS[incident.severity] ?? incident.severity} />}
        />
        <DetailField
          label="Statut"
          value={<StatusBadge status={(INCIDENT_STATUS_TONE[incident.status] ?? "none") as ComplianceStatus} label={INCIDENT_STATUS_LABELS[incident.status] ?? incident.status} />}
        />
        <DetailField
          label="Site"
          value={
            incident.site_id && siteName ? (
              <Link href={`/dashboard/sites/${incident.site_id}`} className="hover:underline">{siteName}</Link>
            ) : (
              siteName
            )
          }
        />
        <DetailField label="Zone" value={incident.zone} />
        <DetailField label="Date de l'événement" value={formatDate(incident.occurred_at)} />
        <DetailField label="Élément lié" value={relatedLabel && relatedName ? `${relatedLabel} ${relatedName}` : relatedLabel} />
        <DetailField label="Responsable" value={pName(incident.responsible_id)} />
        <DetailField label="Superviseur" value={pName(incident.supervisor_id)} />
      </DetailGrid>

      {incident.description ? (
        <DetailSection title="Description">
          <p className="text-sm text-foreground whitespace-pre-line">{incident.description}</p>
        </DetailSection>
      ) : null}

      {/* Action corrective */}
      <DetailSection title="Action corrective">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Priorité</TH><TH>Échéance</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {!correctiveAction ? (
              <EmptyRow colSpan={4} message="Aucune action corrective. Utilisez le bouton « Action corrective » pour en créer une." />
            ) : (
              <ClickableRow href={`/dashboard/actions/${correctiveAction.id}`}>
                <TD className="font-medium">{correctiveAction.title}</TD>
                <TD>{PRIORITY_LABELS[correctiveAction.priority] ?? correctiveAction.priority}</TD>
                <TD>{formatDate(correctiveAction.due_date)}</TD>
                <TD><StatusBadge status={complianceFromActionStatus(correctiveAction.status)} label={ACTION_STATUS_LABELS[correctiveAction.status]} /></TD>
              </ClickableRow>
            )}
          </tbody>
        </Table>
      </DetailSection>
    </div>
  );
}
