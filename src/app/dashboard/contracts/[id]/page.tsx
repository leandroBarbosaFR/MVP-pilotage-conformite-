import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import { getContractDetail } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField, DetailSection } from "@/components/app/detail-field";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/app/clickable-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_TONE } from "@/types/enums";
import { statusFromDate } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/types/database";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireContext();

  const { contract, provider, site, document, profileName } = await getContractDetail(id);
  if (!contract) notFound();

  const pName = (pid: string | null) => (pid ? profileName.get(pid) ?? "—" : "—");
  const amount =
    contract.amount != null
      ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: contract.currency ?? "EUR" }).format(contract.amount)
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/contracts"
        backLabel="Retour aux contrats"
        title={contract.title}
        description={contract.contract_type ?? undefined}
        action={<ArchiveButton table="contracts" id={contract.id} archived={contract.is_archived} />}
      />

      {/* Informations générales */}
      <DetailGrid>
        <DetailField label="Type de contrat" value={contract.contract_type} />
        <DetailField
          label="Statut"
          value={<StatusBadge status={(CONTRACT_STATUS_TONE[contract.status] ?? "none") as ComplianceStatus} label={CONTRACT_STATUS_LABELS[contract.status] ?? contract.status} />}
        />
        <DetailField
          label="Prestataire"
          value={provider ? <Link href={`/dashboard/providers/${provider.id}`} className="hover:underline">{provider.name}</Link> : null}
        />
        <DetailField
          label="Site"
          value={site ? <Link href={`/dashboard/sites/${site.id}`} className="hover:underline">{site.name}</Link> : null}
        />
        <DetailField label="Date de début" value={formatDate(contract.start_date)} />
        <DetailField label="Date de fin" value={formatDate(contract.end_date)} />
        <DetailField
          label="Renouvellement"
          value={
            contract.renewal_date ? (
              <span className="inline-flex items-center gap-2">
                {formatDate(contract.renewal_date)}
                <StatusBadge status={statusFromDate(contract.renewal_date)} label="" />
              </span>
            ) : null
          }
        />
        <DetailField label="Préavis" value={contract.notice_period_days != null ? `${contract.notice_period_days} jours` : null} />
        <DetailField label="Montant" value={amount} />
        <DetailField label="Responsable" value={pName(contract.responsible_id)} />
        <DetailField label="Superviseur" value={pName(contract.supervisor_id)} />
      </DetailGrid>

      {contract.notes ? (
        <DetailSection title="Notes">
          <p className="text-sm text-foreground whitespace-pre-line">{contract.notes}</p>
        </DetailSection>
      ) : null}

      {/* Document contractuel */}
      <DetailSection title="Document contractuel">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Type</TH><TH>Expiration</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {!document ? (
              <EmptyRow colSpan={4} message="Aucun document contractuel rattaché." />
            ) : (
              <ClickableRow href={`/dashboard/documents/${document.id}`}>
                <TD className="font-medium">
                  <Link href={`/dashboard/documents/${document.id}`} className="hover:underline">{document.title}</Link>
                </TD>
                <TD>{document.document_type ?? "—"}</TD>
                <TD>{formatDate(document.expiration_date)}</TD>
                <TD><StatusBadge status={statusFromDate(document.expiration_date)} /></TD>
              </ClickableRow>
            )}
          </tbody>
        </Table>
      </DetailSection>
    </div>
  );
}
