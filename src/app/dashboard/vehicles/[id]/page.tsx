import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import {
  getVehicle,
  getLinkedObligations,
  getLinkedDocuments,
  getEntityActions,
  getEntityIncidents,
  getSiteOptions,
  getEmployeeNames,
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

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireContext();

  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  const [obligations, documents, actions, incidents, sites, empNames, profiles] = await Promise.all([
    getLinkedObligations("linked_vehicle_id", id),
    getLinkedDocuments("vehicle_id", id),
    getEntityActions("VEHICLE", id),
    getEntityIncidents("VEHICLE", id),
    getSiteOptions(company.id),
    getEmployeeNames(company.id),
    getProfiles(company.id),
  ]);

  const siteName = vehicle.site_id ? sites.find((s) => s.id === vehicle.site_id)?.name ?? "—" : "—";
  const driverName = vehicle.main_driver_id ? empNames.get(vehicle.main_driver_id) ?? "—" : "—";
  const pName = (pid: string | null) => {
    if (!pid) return "—";
    const p = profiles.find((x) => x.id === pid);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  const deadlines = [
    { label: "Contrôle technique", date: vehicle.technical_inspection_expiry },
    { label: "Assurance", date: vehicle.insurance_expiry },
    { label: "Prochain entretien", date: vehicle.next_maintenance },
    { label: "Tachygraphe", date: vehicle.tachograph_expiry },
    { label: "Extincteur véhicule", date: vehicle.extinguisher_expiry },
  ].filter((d) => d.date);

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/vehicles"
        backLabel="Retour aux véhicules"
        title={vehicle.registration_number}
        description={[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || undefined}
        action={<ArchiveButton table="vehicles" id={vehicle.id} archived={vehicle.is_archived} />}
      />

      {/* Informations générales */}
      <DetailGrid>
        <DetailField label="Immatriculation" value={vehicle.registration_number} />
        <DetailField label="Type" value={vehicle.vehicle_type} />
        <DetailField label="Marque / modèle" value={[vehicle.brand, vehicle.model].filter(Boolean).join(" ")} />
        <DetailField label="Site / agence" value={siteName === "—" ? null : siteName} />
        <DetailField
          label="Conducteur principal"
          value={
            vehicle.main_driver_id ? (
              <Link href={`/dashboard/employees/${vehicle.main_driver_id}`} className="hover:underline">{driverName}</Link>
            ) : null
          }
        />
        <DetailField label="Responsable parc" value={pName(vehicle.fleet_manager_id ?? vehicle.responsible_id)} />
        <DetailField label="Mise en service" value={formatDate(vehicle.service_date)} />
        <DetailField label="Kilométrage" value={vehicle.mileage != null ? `${vehicle.mileage.toLocaleString("fr-FR")} km` : null} />
        <DetailField label="Statut" value={vehicle.status} />
      </DetailGrid>

      {/* Échéances à venir (alertes véhicule) */}
      <DetailSection title="Échéances à venir">
        <Table>
          <THead>
            <TR><TH>Élément</TH><TH>Échéance</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {deadlines.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucune échéance renseignée." />
            ) : (
              deadlines.map((d) => (
                <TR key={d.label}>
                  <TD className="font-medium">{d.label}</TD>
                  <TD>{formatDate(d.date)}</TD>
                  <TD><StatusBadge status={statusFromDate(d.date)} /></TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Obligations liées */}
      <DetailSection title="Obligations liées">
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

      {/* Actions liées */}
      <DetailSection title="Actions liées">
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

      {/* Incidents / sinistres */}
      <DetailSection title="Incidents & sinistres">
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

      {/* Documents liés */}
      <DetailSection title="Documents liés">
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
