import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import { getSiteDetail } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField, DetailSection } from "@/components/app/detail-field";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { OBLIGATION_STATUS_LABELS, complianceFromObligationStatus } from "@/lib/status";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_TONE, AUDIT_STATUS_LABELS, AUDIT_STATUS_TONE } from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/types/database";

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireContext();

  const { site, obligations, contracts, audits } = await getSiteDetail(id);
  if (!site) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={site.name}
        action={<ArchiveButton table="sites" id={site.id} archived={site.is_archived} />}
      />

      <DetailGrid>
        <DetailField label="Type" value={site.site_type} />
        <DetailField label="Activité" value={site.activity_type} />
        <DetailField label="Adresse" value={site.address} />
        <DetailField label="Ville" value={[site.postal_code, site.city].filter(Boolean).join(" ")} />
        <DetailField label="Pays" value={site.country} />
        <DetailField label="Surface" value={site.surface_area ? `${site.surface_area} m²` : "—"} />
        <DetailField label="Statut" value={site.status} />
      </DetailGrid>

      <DetailSection title="Obligations & contrôles du site">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Échéance</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {obligations.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucune obligation liée." />
            ) : (
              obligations.map((o) => (
                <TR key={o.id}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/obligations/${o.id}`} className="hover:underline">{o.title}</Link>
                  </TD>
                  <TD>{formatDate(o.due_date)}</TD>
                  <TD>
                    <StatusBadge status={complianceFromObligationStatus(o.status)} label={OBLIGATION_STATUS_LABELS[o.status]} />
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      <DetailSection title="Contrats liés">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Renouvellement</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {contracts.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucun contrat lié." />
            ) : (
              contracts.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium">{c.title}</TD>
                  <TD>{formatDate(c.renewal_date)}</TD>
                  <TD>
                    <StatusBadge status={(CONTRACT_STATUS_TONE[c.status] ?? "none") as ComplianceStatus} label={CONTRACT_STATUS_LABELS[c.status] ?? c.status} />
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      <DetailSection title="Audits & inspections">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Date prévue</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {audits.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucun audit lié." />
            ) : (
              audits.map((a) => (
                <TR key={a.id}>
                  <TD className="font-medium">{a.title}</TD>
                  <TD>{formatDate(a.planned_date)}</TD>
                  <TD>
                    <StatusBadge status={(AUDIT_STATUS_TONE[a.status] ?? "none") as ComplianceStatus} label={AUDIT_STATUS_LABELS[a.status] ?? a.status} />
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>
    </div>
  );
}
