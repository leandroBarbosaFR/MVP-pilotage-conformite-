import { requireContext } from "@/lib/queries/auth";
import { getAudits, getSites, getProviders, getProfiles, getAuditStatsMap, getDocuments } from "@/lib/queries/entities";
import { createAudit } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { AUDIT_TYPES, AUDIT_STATUS_LABELS, AUDIT_STATUS_TONE, AUDIT_RESULT_LABELS } from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus, Site, Provider, Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;

export default async function AuditsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, sites, providers, profiles, documents] = await Promise.all([
    getAudits(company.id, { search: sp.q, status: sp.status, includeArchived, page, pageSize: PAGE_SIZE }),
    getSites(company.id, { pageSize: 500 }),
    getProviders(company.id, { pageSize: 500 }),
    getProfiles(company.id),
    getDocuments(company.id, { pageSize: 500 }),
  ]);

  const stats = await getAuditStatsMap(company.id, rows.map((a) => a.id));
  const docTitle = new Map(documents.rows.map((d) => [d.id, d.title]));

  const siteName = (id: string | null) => sites.rows.find((sx) => sx.id === id)?.name ?? "—";

  const profName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    if (!p) return "—";
    return [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—";
  };

  return (
    <div>
      <PageHeader
        title="Audits et inspections"
        description="Audits internes/clients, inspections et visites — planning, résultats et suivi."
        action={
          <AddPanel title="Nouvel audit">
            <AuditForm sites={sites.rows} providers={providers.rows} profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/audits" search={sp.q} includeArchived={includeArchived}>
        <div className="w-40">
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">Tous statuts</option>
            {Object.entries(AUDIT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(a) => a.id}
        href={(a) => `/dashboard/audits/${a.id}`}
        empty="Aucun audit."
        columns={[
          { header: "Titre", cell: (a) => <span className="font-medium">{a.title}</span> },
          { header: "Type", cell: (a) => a.audit_type ?? "—" },
          { header: "Site", cell: (a) => siteName(a.site_id) },
          { header: "Date prévue", cell: (a) => formatDate(a.planned_date) },
          { header: "Résultat", cell: (a) => a.result ? (AUDIT_RESULT_LABELS[a.result] ?? a.result) : "—" },
          { header: "Responsable", cell: (a) => profName(a.responsible_id) },
          { header: "Rapport", cell: (a) => a.report_document_id ? (docTitle.get(a.report_document_id) ?? "Disponible") : "—" },
          { header: "NC", align: "right", cell: (a) => stats.get(a.id)?.ncCount ?? 0 },
          { header: "Actions ouvertes", align: "right", cell: (a) => stats.get(a.id)?.openActions ?? 0 },
          { header: "Statut", cell: (a) => <StatusBadge status={(AUDIT_STATUS_TONE[a.status] ?? "none") as ComplianceStatus} label={AUDIT_STATUS_LABELS[a.status] ?? a.status} /> },
        ]}
        card={(a) => ({
          title: a.title,
          badge: <StatusBadge status={(AUDIT_STATUS_TONE[a.status] ?? "none") as ComplianceStatus} label={AUDIT_STATUS_LABELS[a.status] ?? a.status} />,
          fields: [
            { label: "Site", value: siteName(a.site_id) },
            { label: "Date prévue", value: formatDate(a.planned_date) },
            { label: "Responsable", value: profName(a.responsible_id) },
          ],
        })}
        actions={(a) => <ArchiveButton table="audits" id={a.id} archived={a.is_archived} />}
      />

      <Pagination basePath="/dashboard/audits" page={page} count={count} pageSize={PAGE_SIZE} params={{ q: sp.q, status: sp.status, archived: sp.archived }} />
    </div>
  );
}

function AuditForm({ sites, providers, profiles }: { sites: Site[]; providers: Provider[]; profiles: Profile[] }) {
  return (
    <form action={createAudit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Titre</Label>
        <Input name="title" required />
      </div>
      <div>
        <Label>Type d&apos;audit</Label>
        <Select name="audit_type" defaultValue={AUDIT_TYPES[0]}>
          {AUDIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>
      <div>
        <Label>Statut</Label>
        <Select name="status" defaultValue="PLANNED">
          {Object.entries(AUDIT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
        <Label>Prestataire / auditeur externe</Label>
        <Select name="provider_id" defaultValue="">
          <option value="">Aucun</option>
          {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Auditeur (nom)</Label>
        <Input name="auditor_name" />
      </div>
      <div>
        <Label>Résultat</Label>
        <Select name="result" defaultValue="">
          <option value="">—</option>
          {Object.entries(AUDIT_RESULT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      <div>
        <Label>Date prévue</Label>
        <Input name="planned_date" type="date" />
      </div>
      <div>
        <Label>Date réalisée</Label>
        <Input name="completed_date" type="date" />
      </div>
      <div>
        <Label>Responsable</Label>
        <Select name="responsible_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>)}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Notes</Label>
        <Textarea name="notes" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer l&apos;audit</Button>
      </div>
    </form>
  );
}
