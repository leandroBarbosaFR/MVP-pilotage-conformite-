import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import {
  getEpi,
  getLinkedDocuments,
  getEmployeeNames,
  getProfiles,
} from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField, DetailSection } from "@/components/app/detail-field";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { statusFromDate, STATUS_LABELS } from "@/lib/status";
import { formatDate } from "@/lib/utils";

export default async function EpiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requireContext();

  const epi = await getEpi(id);
  if (!epi) notFound();

  const [documents, names, profiles] = await Promise.all([
    getLinkedDocuments("epi_id", id),
    getEmployeeNames(company.id),
    getProfiles(company.id),
  ]);

  const profileName = (pid: string | null) => {
    if (!pid) return "—";
    const p = profiles.find((x) => x.id === pid);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  const title = [epi.epi_type, epi.internal_reference].filter(Boolean).join(" — ");
  const renewalStatus = statusFromDate(epi.renewal_date);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title || "EPI"}
        action={<ArchiveButton table="epi" id={epi.id} archived={epi.is_archived} />}
      />

      <DetailGrid>
        <DetailField label="Type" value={epi.epi_type} />
        <DetailField label="Référence interne" value={epi.internal_reference} />
        <DetailField
          label="Personne assignée"
          value={epi.assigned_employee_id ? names.get(epi.assigned_employee_id) ?? "—" : "—"}
        />
        <DetailField label="Date de remise" value={formatDate(epi.issue_date)} />
        <DetailField label="Date de renouvellement" value={formatDate(epi.renewal_date)} />
        <DetailField label="Responsable" value={profileName(epi.responsible_id)} />
        <DetailField label="Superviseur" value={profileName(epi.supervisor_id)} />
        <DetailField label="Statut" value={epi.status} />
      </DetailGrid>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Conformité renouvellement :</span>
        <StatusBadge status={renewalStatus} label={STATUS_LABELS[renewalStatus]} />
      </div>

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
              <EmptyRow colSpan={3} message="Aucun document lié." />
            ) : (
              documents.map((d) => (
                <TR key={d.id}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/documents/${d.id}`} className="hover:underline">
                      {d.title}
                    </Link>
                  </TD>
                  <TD>{d.document_type ?? "—"}</TD>
                  <TD>{formatDate(d.expiration_date)}</TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>
    </div>
  );
}
