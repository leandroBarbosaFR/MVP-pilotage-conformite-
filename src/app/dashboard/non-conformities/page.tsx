import { requireContext } from "@/lib/queries/auth";
import { getNonConformities, getSites, getProfiles } from "@/lib/queries/entities";
import { createNonConformity } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { NC_SOURCE_TYPES, NC_STATUS_LABELS, NC_STATUS_TONE } from "@/types/enums";
import { PRIORITY_LABELS } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus, Site, Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;

const SEV_TONE: Record<string, ComplianceStatus> = {
  LOW: "none",
  MEDIUM: "warn",
  HIGH: "warn",
  CRITICAL: "danger",
};

export default async function NonConformitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, sites, profiles] = await Promise.all([
    getNonConformities(company.id, { search: sp.q, status: sp.status, includeArchived, page, pageSize: PAGE_SIZE }),
    getSites(company.id, { pageSize: 500 }),
    getProfiles(company.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Non-conformités"
        description="Écarts détectés (audits, contrôles, inspections) et leur traitement."
        action={
          <AddPanel title="Nouvelle non-conformité">
            <NcForm sites={sites.rows} profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/non-conformities" search={sp.q} includeArchived={includeArchived}>
        <div className="w-40">
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">Tous statuts</option>
            {Object.entries(NC_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
      </ListToolbar>

      <Table>
        <THead>
          <TR>
            <TH>Titre</TH>
            <TH>Source</TH>
            <TH>Détectée le</TH>
            <TH>Gravité</TH>
            <TH>Statut</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} message="Aucune non-conformité." />
          ) : (
            rows.map((n) => (
              <TR key={n.id}>
                <TD className="font-medium">{n.title}</TD>
                <TD>{n.source_type ?? "—"}</TD>
                <TD>{formatDate(n.detected_at)}</TD>
                <TD>
                  <StatusBadge status={SEV_TONE[n.severity] ?? "none"} label={PRIORITY_LABELS[n.severity] ?? n.severity} />
                </TD>
                <TD>
                  <StatusBadge status={(NC_STATUS_TONE[n.status] ?? "none") as ComplianceStatus} label={NC_STATUS_LABELS[n.status] ?? n.status} />
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <ArchiveButton table="non_conformities" id={n.id} archived={n.is_archived} />
                  </div>
                </TD>
              </TR>
            ))
          )}
        </tbody>
      </Table>

      <Pagination basePath="/dashboard/non-conformities" page={page} count={count} pageSize={PAGE_SIZE} params={{ q: sp.q, status: sp.status, archived: sp.archived }} />
    </div>
  );
}

function NcForm({ sites, profiles }: { sites: Site[]; profiles: Profile[] }) {
  return (
    <form action={createNonConformity} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Titre</Label>
        <Input name="title" required />
      </div>
      <div>
        <Label>Gravité</Label>
        <Select name="severity" defaultValue="MEDIUM">
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      <div>
        <Label>Statut</Label>
        <Select name="status" defaultValue="OPEN">
          {Object.entries(NC_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      <div>
        <Label>Source</Label>
        <Select name="source_type" defaultValue={NC_SOURCE_TYPES[0]}>
          {NC_SOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>
      <div>
        <Label>Site</Label>
        <Select name="site_id" defaultValue="">
          <option value="">Aucun</option>
          {sites.map((sx) => <option key={sx.id} value={sx.id}>{sx.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Détectée le</Label>
        <Input name="detected_at" type="date" />
      </div>
      <div>
        <Label>Responsable</Label>
        <Select name="responsible_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>)}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Textarea name="description" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer la non-conformité</Button>
      </div>
    </form>
  );
}
