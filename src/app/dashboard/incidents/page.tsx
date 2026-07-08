import { requireContext } from "@/lib/queries/auth";
import { getIncidents, getSites, getProfiles } from "@/lib/queries/entities";
import { createIncident } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { CreateIncidentCorrectiveActionButton } from "@/components/incidents/create-incident-corrective-action-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { PRIORITY_LABELS } from "@/lib/status";
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_STATUS_TONE,
  IncidentType,
  IncidentStatus,
  PRIORITY_TONE,
} from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus, Site, Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, sites, profiles] = await Promise.all([
    getIncidents(company.id, { search: sp.q, status: sp.status, category: sp.type, includeArchived, page, pageSize: PAGE_SIZE }),
    getSites(company.id, { pageSize: 500 }),
    getProfiles(company.id),
  ]);

  const siteName = (id: string | null) => (id ? sites.rows.find((s) => s.id === id)?.name ?? "—" : "—");
  const profName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  return (
    <div>
      <PageHeader
        title="Incidents & observations sécurité"
        description="Incidents, presque-accidents et observations terrain, et leurs actions correctives."
        action={
          <AddPanel title="Nouvel incident">
            <IncidentForm sites={sites.rows} profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/incidents" search={sp.q} includeArchived={includeArchived}>
        <Select name="type" defaultValue={sp.type ?? ""} className="w-44">
          <option value="">Tous les types</option>
          {Object.values(IncidentType).map((t) => (
            <option key={t} value={t}>{INCIDENT_TYPE_LABELS[t]}</option>
          ))}
        </Select>
        <Select name="status" defaultValue={sp.status ?? ""} className="w-40">
          <option value="">Tous statuts</option>
          {Object.values(IncidentStatus).map((v) => (
            <option key={v} value={v}>{INCIDENT_STATUS_LABELS[v]}</option>
          ))}
        </Select>
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(n) => n.id}
        href={(n) => `/dashboard/incidents/${n.id}`}
        empty="Aucun incident."
        columns={[
          { header: "Type", cell: (n) => INCIDENT_TYPE_LABELS[n.type] ?? n.type },
          { header: "Titre", cell: (n) => <span className="font-medium">{n.title}</span> },
          { header: "Site", cell: (n) => siteName(n.site_id) },
          { header: "Zone", cell: (n) => n.zone ?? "—" },
          { header: "Date", cell: (n) => formatDate(n.occurred_at) },
          { header: "Gravité", cell: (n) => <StatusBadge status={(PRIORITY_TONE[n.severity] ?? "none") as ComplianceStatus} label={PRIORITY_LABELS[n.severity] ?? n.severity} /> },
          { header: "Responsable", cell: (n) => profName(n.responsible_id) },
          { header: "Statut", cell: (n) => <StatusBadge status={(INCIDENT_STATUS_TONE[n.status] ?? "none") as ComplianceStatus} label={INCIDENT_STATUS_LABELS[n.status] ?? n.status} /> },
        ]}
        card={(n) => ({
          title: n.title,
          badge: <StatusBadge status={(INCIDENT_STATUS_TONE[n.status] ?? "none") as ComplianceStatus} label={INCIDENT_STATUS_LABELS[n.status] ?? n.status} />,
          fields: [
            { label: "Type", value: INCIDENT_TYPE_LABELS[n.type] ?? n.type },
            { label: "Site", value: siteName(n.site_id) },
            { label: "Date", value: formatDate(n.occurred_at) },
          ],
        })}
        actions={(n) => (
          <>
            {!n.corrective_action_id ? <CreateIncidentCorrectiveActionButton incidentId={n.id} /> : null}
            <ArchiveButton table="incidents" id={n.id} archived={n.is_archived} />
          </>
        )}
      />

      <Pagination
        basePath="/dashboard/incidents"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, status: sp.status, type: sp.type, archived: sp.archived }}
      />
    </div>
  );
}

function IncidentForm({ sites, profiles }: { sites: Site[]; profiles: Profile[] }) {
  return (
    <form action={createIncident} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label>Type</Label>
        <Select name="type" defaultValue={IncidentType.INCIDENT}>
          {Object.values(IncidentType).map((t) => <option key={t} value={t}>{INCIDENT_TYPE_LABELS[t]}</option>)}
        </Select>
      </div>
      <div>
        <Label>Gravité</Label>
        <Select name="severity" defaultValue="MEDIUM">
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Titre</Label>
        <Input name="title" required />
      </div>
      <div>
        <Label>Site</Label>
        <Select name="site_id" defaultValue="">
          <option value="">Aucun</option>
          {sites.map((sx) => <option key={sx.id} value={sx.id}>{sx.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Zone</Label>
        <Input name="zone" placeholder="Quai, zone caristes, stockage…" />
      </div>
      <div>
        <Label>Date de l&apos;événement</Label>
        <Input name="occurred_at" type="date" />
      </div>
      <div>
        <Label>Statut</Label>
        <Select name="status" defaultValue="OPEN">
          {Object.values(IncidentStatus).map((v) => <option key={v} value={v}>{INCIDENT_STATUS_LABELS[v]}</option>)}
        </Select>
      </div>
      <div>
        <Label>Responsable</Label>
        <Select name="responsible_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>)}
        </Select>
      </div>
      <div>
        <Label>Superviseur</Label>
        <Select name="supervisor_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>)}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Textarea name="description" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer l&apos;incident</Button>
      </div>
    </form>
  );
}
