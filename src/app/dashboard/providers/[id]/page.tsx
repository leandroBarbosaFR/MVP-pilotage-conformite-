import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import { getProviderDetail } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField, DetailSection } from "@/components/app/detail-field";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/app/clickable-row";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  OBLIGATION_STATUS_LABELS,
  ACTION_STATUS_LABELS,
  PRIORITY_LABELS,
  complianceFromObligationStatus,
  complianceFromActionStatus,
  statusFromDate,
} from "@/lib/status";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_TONE } from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/types/database";

export default async function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireContext();

  const { provider, contracts, obligations, documents, actions, siteName, profileName } =
    await getProviderDetail(id);
  if (!provider) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const insuranceExpired = provider.insurance_expiry ? provider.insurance_expiry < today : false;
  const pName = (pid: string | null) => (pid ? profileName.get(pid) ?? "—" : "—");

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/providers"
        backLabel="Retour aux prestataires"
        title={provider.name}
        description={[provider.provider_type, siteName].filter(Boolean).join(" · ") || undefined}
        action={<ArchiveButton table="providers" id={provider.id} archived={provider.is_archived} />}
      />

      {/* Informations générales */}
      <DetailGrid>
        <DetailField label="Type" value={provider.provider_type} />
        <DetailField label="Site concerné" value={siteName} />
        <DetailField label="Contact" value={provider.contact_name} />
        <DetailField label="Email" value={provider.email} />
        <DetailField label="Téléphone" value={provider.phone} />
        <DetailField label="Ville" value={provider.city} />
        <DetailField label="Responsable interne" value={pName(provider.responsible_id)} />
        <DetailField
          label="Assurance"
          value={
            provider.insurance_expiry ? (
              <span className={insuranceExpired ? "text-status-danger" : undefined}>{formatDate(provider.insurance_expiry)}</span>
            ) : (
              <span className="text-status-danger">Non renseignée</span>
            )
          }
        />
        <DetailField label="Relance" value={provider.needs_followup ? "À relancer" : "—"} />
      </DetailGrid>

      {/* Contrats liés */}
      <DetailSection title="Contrats liés">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Type</TH><TH>Fin</TH><TH>Renouvellement</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {contracts.length === 0 ? (
              <EmptyRow colSpan={5} message="Aucun contrat lié." />
            ) : (
              contracts.map((c) => (
                <ClickableRow key={c.id} href={`/dashboard/contracts/${c.id}`}>
                  <TD className="font-medium">{c.title}</TD>
                  <TD>{c.contract_type ?? "—"}</TD>
                  <TD>{formatDate(c.end_date)}</TD>
                  <TD>{formatDate(c.renewal_date)}</TD>
                  <TD><StatusBadge status={(CONTRACT_STATUS_TONE[c.status] ?? "none") as ComplianceStatus} label={CONTRACT_STATUS_LABELS[c.status] ?? c.status} /></TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Obligations liées */}
      <DetailSection title="Obligations & interventions">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Échéance</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {obligations.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucune obligation liée." />
            ) : (
              obligations.map((o) => (
                <ClickableRow key={o.id} href={`/dashboard/obligations/${o.id}`}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/obligations/${o.id}`} className="hover:underline">{o.title}</Link>
                  </TD>
                  <TD>{formatDate(o.due_date)}</TD>
                  <TD><StatusBadge status={complianceFromObligationStatus(o.status)} label={OBLIGATION_STATUS_LABELS[o.status]} /></TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Actions liées */}
      <DetailSection title="Actions & relances">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Priorité</TH><TH>Échéance</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {actions.length === 0 ? (
              <EmptyRow colSpan={4} message="Aucune action liée." />
            ) : (
              actions.map((a) => (
                <ClickableRow key={a.id} href={`/dashboard/actions/${a.id}`}>
                  <TD className="font-medium">{a.title}</TD>
                  <TD>{PRIORITY_LABELS[a.priority] ?? a.priority}</TD>
                  <TD>{formatDate(a.due_date)}</TD>
                  <TD><StatusBadge status={complianceFromActionStatus(a.status)} label={ACTION_STATUS_LABELS[a.status]} /></TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Documents liés */}
      <DetailSection title="Documents (assurance, plan de prévention, attestations…)">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Type</TH><TH>Expiration</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {documents.length === 0 ? (
              <EmptyRow colSpan={4} message="Aucun document lié." />
            ) : (
              documents.map((d) => (
                <ClickableRow key={d.id} href={`/dashboard/documents/${d.id}`}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/documents/${d.id}`} className="hover:underline">{d.title}</Link>
                  </TD>
                  <TD>{d.document_type ?? "—"}</TD>
                  <TD>{formatDate(d.expiration_date)}</TD>
                  <TD><StatusBadge status={statusFromDate(d.expiration_date)} /></TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>
    </div>
  );
}
