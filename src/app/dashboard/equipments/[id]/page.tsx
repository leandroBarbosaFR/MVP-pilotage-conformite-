import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import {
  getEquipment,
  getLinkedObligations,
  getLinkedDocuments,
  getEntityActions,
  getEntityIncidents,
  getSiteOptions,
  getProviders,
  getProfiles,
} from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField, DetailSection } from "@/components/app/detail-field";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/app/clickable-row";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CATEGORY_LABELS,
  OBLIGATION_STATUS_LABELS,
  ACTION_STATUS_LABELS,
  PRIORITY_LABELS,
  FREQUENCY_LABELS,
  complianceFromObligationStatus,
  complianceFromActionStatus,
  statusFromDate,
} from "@/lib/status";
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_STATUS_TONE,
} from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/types/database";

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireContext();

  const equipment = await getEquipment(id);
  if (!equipment) notFound();

  const [obligations, documents, actions, incidents, sites, providersRes, profiles] = await Promise.all([
    getLinkedObligations("linked_equipment_id", id),
    getLinkedDocuments("equipment_id", id),
    getEntityActions("EQUIPMENT", id),
    getEntityIncidents("EQUIPMENT", id),
    getSiteOptions(company.id),
    getProviders(company.id, { pageSize: 200 }),
    getProfiles(company.id),
  ]);

  const siteName = equipment.site_id
    ? sites.find((s) => s.id === equipment.site_id)?.name ?? equipment.site ?? "—"
    : equipment.site ?? "—";
  const providerName = equipment.provider_id
    ? providersRes.rows.find((p) => p.id === equipment.provider_id)?.name ?? "—"
    : "—";
  const pName = (pid: string | null) => {
    if (!pid) return "—";
    const p = profiles.find((x) => x.id === pid);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/equipments"
        backLabel="Retour aux équipements"
        title={equipment.name}
        description={[equipment.category ?? equipment.equipment_type, siteName !== "—" ? siteName : null].filter(Boolean).join(" · ") || undefined}
        action={<ArchiveButton table="equipments" id={equipment.id} archived={equipment.is_archived} />}
      />

      {/* Informations générales */}
      <DetailGrid>
        <DetailField label="Nom" value={equipment.name} />
        <DetailField label="Catégorie" value={equipment.category} />
        <DetailField label="Type" value={equipment.equipment_type} />
        <DetailField label="N° de série" value={equipment.serial_number} />
        <DetailField label="Réf interne" value={equipment.internal_reference} />
        <DetailField label="Site / zone" value={siteName === "—" ? null : siteName} />
        <DetailField label="Dernier contrôle" value={formatDate(equipment.last_check_date)} />
        <DetailField label="Prochain contrôle" value={formatDate(equipment.next_check_date)} />
        <DetailField label="Fréquence" value={equipment.frequency ? FREQUENCY_LABELS[equipment.frequency] ?? equipment.frequency : null} />
        <DetailField label="Prestataire" value={providerName === "—" ? null : providerName} />
        <DetailField label="Responsable" value={pName(equipment.responsible_id)} />
        <DetailField label="Statut" value={equipment.status} />
      </DetailGrid>

      {/* Contrôles à venir */}
      <DetailSection title="Contrôles à venir">
        <Table>
          <THead>
            <TR><TH>Contrôle</TH><TH>Dernier</TH><TH>Prochain</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {!equipment.next_check_date && !equipment.last_check_date ? (
              <EmptyRow colSpan={4} message="Aucun contrôle périodique renseigné." />
            ) : (
              <TR>
                <TD className="font-medium">Contrôle périodique</TD>
                <TD>{formatDate(equipment.last_check_date)}</TD>
                <TD>{formatDate(equipment.next_check_date)}</TD>
                <TD><StatusBadge status={statusFromDate(equipment.next_check_date)} /></TD>
              </TR>
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Obligations liées */}
      <DetailSection title="Obligations & contrôles réglementaires">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Catégorie</TH><TH>Échéance</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {obligations.length === 0 ? (
              <EmptyRow colSpan={4} message="Aucun élément." />
            ) : (
              obligations.map((o) => (
                <ClickableRow key={o.id} href={`/dashboard/obligations/${o.id}`}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/obligations/${o.id}`} className="hover:underline">{o.title}</Link>
                  </TD>
                  <TD>{CATEGORY_LABELS[o.category]}</TD>
                  <TD>{formatDate(o.due_date)}</TD>
                  <TD><StatusBadge status={complianceFromObligationStatus(o.status)} label={OBLIGATION_STATUS_LABELS[o.status]} /></TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Actions correctives */}
      <DetailSection title="Actions correctives">
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

      {/* Incidents */}
      <DetailSection title="Incidents">
        <Table>
          <THead>
            <TR><TH>Type</TH><TH>Titre</TH><TH>Date</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {incidents.length === 0 ? (
              <EmptyRow colSpan={4} message="Aucun incident lié." />
            ) : (
              incidents.map((n) => (
                <ClickableRow key={n.id} href={`/dashboard/incidents/${n.id}`}>
                  <TD>{INCIDENT_TYPE_LABELS[n.type] ?? n.type}</TD>
                  <TD className="font-medium">{n.title}</TD>
                  <TD>{formatDate(n.occurred_at)}</TD>
                  <TD><StatusBadge status={(INCIDENT_STATUS_TONE[n.status] ?? "none") as ComplianceStatus} label={INCIDENT_STATUS_LABELS[n.status] ?? n.status} /></TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Documents & certificats */}
      <DetailSection title="Documents & certificats">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Type</TH><TH>Expiration</TH></TR>
          </THead>
          <tbody>
            {documents.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucun élément." />
            ) : (
              documents.map((d) => (
                <ClickableRow key={d.id} href={`/dashboard/documents/${d.id}`}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/documents/${d.id}`} className="hover:underline">{d.title}</Link>
                  </TD>
                  <TD>{d.document_type ?? "—"}</TD>
                  <TD>{formatDate(d.expiration_date)}</TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>
    </div>
  );
}
