import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import { getVehicle, getLinkedObligations, getLinkedDocuments } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField, DetailSection } from "@/components/app/detail-field";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/app/clickable-row";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CATEGORY_LABELS,
  OBLIGATION_STATUS_LABELS,
  complianceFromObligationStatus,
} from "@/lib/status";
import { formatDate } from "@/lib/utils";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireContext();

  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  const [obligations, documents] = await Promise.all([
    getLinkedObligations("linked_vehicle_id", id),
    getLinkedDocuments("vehicle_id", id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={vehicle.registration_number}
        action={<ArchiveButton table="vehicles" id={vehicle.id} archived={vehicle.is_archived} />}
      />

      <DetailGrid>
        <DetailField label="Immatriculation" value={vehicle.registration_number} />
        <DetailField label="Type" value={vehicle.vehicle_type} />
        <DetailField label="Marque" value={vehicle.brand} />
        <DetailField label="Modèle" value={vehicle.model} />
        <DetailField label="Mise en service" value={formatDate(vehicle.service_date)} />
        <DetailField label="Statut" value={vehicle.status} />
      </DetailGrid>

      <DetailSection title="Obligations liées">
        <Table>
          <THead>
            <TR>
              <TH>Titre</TH>
              <TH>Catégorie</TH>
              <TH>Échéance</TH>
              <TH>Statut</TH>
            </TR>
          </THead>
          <tbody>
            {obligations.length === 0 ? (
              <EmptyRow colSpan={4} message="Aucun élément." />
            ) : (
              obligations.map((o) => (
                <ClickableRow key={o.id} href={`/dashboard/obligations/${o.id}`}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/obligations/${o.id}`} className="hover:underline">
                      {o.title}
                    </Link>
                  </TD>
                  <TD>{CATEGORY_LABELS[o.category]}</TD>
                  <TD>{formatDate(o.due_date)}</TD>
                  <TD>
                    <StatusBadge
                      status={complianceFromObligationStatus(o.status)}
                      label={OBLIGATION_STATUS_LABELS[o.status]}
                    />
                  </TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

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
    </div>
  );
}
