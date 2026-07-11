import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import { getAuditDetail } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField, DetailSection } from "@/components/app/detail-field";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/app/clickable-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { PRIORITY_LABELS, statusFromDate } from "@/lib/status";
import {
  AUDIT_STATUS_LABELS,
  AUDIT_STATUS_TONE,
  AUDIT_RESULT_LABELS,
  NC_STATUS_LABELS,
  NC_STATUS_TONE,
  PRIORITY_TONE,
} from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/types/database";

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireContext();

  const { audit, ncs, siteName, profileName, reportDoc } = await getAuditDetail(id);
  if (!audit) notFound();

  const pName = (pid: string | null) => (pid ? profileName.get(pid) ?? "—" : "—");

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/audits"
        backLabel="Retour aux audits"
        title={audit.title}
        description={audit.audit_type ?? undefined}
        action={<ArchiveButton table="audits" id={audit.id} archived={audit.is_archived} />}
      />

      <DetailGrid>
        <DetailField label="Type" value={audit.audit_type} />
        <DetailField label="Site" value={siteName} />
        <DetailField label="Auditeur" value={audit.auditor_name} />
        <DetailField label="Date prévue" value={formatDate(audit.planned_date)} />
        <DetailField label="Date réalisée" value={formatDate(audit.completed_date)} />
        <DetailField
          label="Statut"
          value={<StatusBadge status={(AUDIT_STATUS_TONE[audit.status] ?? "none") as ComplianceStatus} label={AUDIT_STATUS_LABELS[audit.status] ?? audit.status} />}
        />
        <DetailField label="Résultat" value={audit.result ? AUDIT_RESULT_LABELS[audit.result] ?? audit.result : null} />
        <DetailField label="Score" value={audit.score != null ? `${audit.score}` : null} />
        <DetailField label="Responsable" value={pName(audit.responsible_id)} />
        <DetailField label="Superviseur" value={pName(audit.supervisor_id)} />
      </DetailGrid>

      {audit.notes ? (
        <DetailSection title="Notes">
          <p className="text-sm text-foreground whitespace-pre-line">{audit.notes}</p>
        </DetailSection>
      ) : null}

      <DetailSection title="Rapport d'audit">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Type</TH><TH>Expiration</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {!reportDoc ? (
              <EmptyRow colSpan={4} message="Aucun rapport rattaché." />
            ) : (
              <ClickableRow href={`/dashboard/documents/${reportDoc.id}`}>
                <TD className="font-medium">
                  <Link href={`/dashboard/documents/${reportDoc.id}`} className="hover:underline">{reportDoc.title}</Link>
                </TD>
                <TD>{reportDoc.document_type ?? "—"}</TD>
                <TD>{formatDate(reportDoc.expiration_date)}</TD>
                <TD><StatusBadge status={statusFromDate(reportDoc.expiration_date)} /></TD>
              </ClickableRow>
            )}
          </tbody>
        </Table>
      </DetailSection>

      <DetailSection title="Non-conformités issues de l'audit">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Gravité</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {ncs.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucune non-conformité liée." />
            ) : (
              ncs.map((n) => (
                <TR key={n.id}>
                  <TD className="font-medium">{n.title}</TD>
                  <TD><StatusBadge status={(PRIORITY_TONE[n.severity] ?? "none") as ComplianceStatus} label={PRIORITY_LABELS[n.severity] ?? n.severity} /></TD>
                  <TD><StatusBadge status={(NC_STATUS_TONE[n.status] ?? "none") as ComplianceStatus} label={NC_STATUS_LABELS[n.status] ?? n.status} /></TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>
    </div>
  );
}
