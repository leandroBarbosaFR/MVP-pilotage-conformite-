import { requireContext } from "@/lib/queries/auth";
import { getNonConformities, getSites, getProfiles, getEntityNameMap, getActions } from "@/lib/queries/entities";
import { createNonPilotix } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel, SubmitButton } from "@/components/app/add-panel";
import { AiActionLink } from "@/components/ai/ai-action-link";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import Link from "next/link";
import { CreateCorrectiveActionButton } from "@/components/nc/create-corrective-action-button";
import { RemoveCorrectiveActionButton } from "@/components/nc/remove-corrective-action-button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { NC_SOURCE_TYPES, NC_STATUS_LABELS, NC_STATUS_TONE, RELATED_ENTITY_LABELS } from "@/types/enums";
import { PRIORITY_LABELS } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus, Site, Profile, NonPilotix } from "@/lib/types/database";

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

  const [{ rows, count }, sites, profiles, entMap, actions] = await Promise.all([
    getNonConformities(company.id, { search: sp.q, status: sp.status, includeArchived, page, pageSize: PAGE_SIZE }),
    getSites(company.id, { pageSize: 500 }),
    getProfiles(company.id),
    getEntityNameMap(company.id),
    getActions(company.id, { pageSize: 500 }),
  ]);

  const actTitle = new Map(actions.rows.map((a) => [a.id, a.title]));

  const profName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    if (!p) return "—";
    return [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—";
  };

  const entityLabel = (n: NonPilotix) =>
    n.related_entity_id
      ? `${RELATED_ENTITY_LABELS[n.related_entity_type as keyof typeof RELATED_ENTITY_LABELS] ?? ""} ${entMap.get(n.related_entity_id) ?? "—"}`.trim()
      : "—";

  return (
    <div>
      <PageHeader
        title="Non-conformités"
        description="Écarts détectés (audits, contrôles, inspections) et leur traitement."
        action={
          <>
            <AiActionLink action="summarize-nc" label="Résumé IA" />
            <AddPanel title="Nouvelle non-conformité">
              <NcForm sites={sites.rows} profiles={profiles} />
            </AddPanel>
          </>
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

      <ListView
        rows={rows}
        getKey={(n) => n.id}
        empty="Aucune non-conformité."
        columns={[
          { header: "Titre", cell: (n) => <span className="font-medium">{n.title}</span> },
          { header: "Entité liée", cell: (n) => entityLabel(n) },
          { header: "Gravité", cell: (n) => <StatusBadge status={SEV_TONE[n.severity] ?? "none"} label={PRIORITY_LABELS[n.severity] ?? n.severity} /> },
          { header: "Échéance", cell: (n) => formatDate(n.due_date) },
          { header: "Responsable", cell: (n) => profName(n.responsible_id) },
          { header: "Action corrective", cell: (n) => n.corrective_action_id ? (
            <Link href={`/dashboard/actions/${n.corrective_action_id}`} className="text-accent hover:underline">
              {actTitle.get(n.corrective_action_id) ?? "Voir l'action"}
            </Link>
          ) : <span className="text-muted-foreground">Non associée</span> },
          { header: "Statut", cell: (n) => <StatusBadge status={(NC_STATUS_TONE[n.status] ?? "none") as ComplianceStatus} label={NC_STATUS_LABELS[n.status] ?? n.status} /> },
        ]}
        card={(n) => ({
          title: n.title,
          badge: <StatusBadge status={(NC_STATUS_TONE[n.status] ?? "none") as ComplianceStatus} label={NC_STATUS_LABELS[n.status] ?? n.status} />,
          fields: [
            { label: "Entité liée", value: entityLabel(n) },
            { label: "Échéance", value: formatDate(n.due_date) },
          ],
        })}
        actions={(n) => (
          <>
            {n.corrective_action_id ? (
              <RemoveCorrectiveActionButton ncId={n.id} />
            ) : (
              <CreateCorrectiveActionButton ncId={n.id} />
            )}
            <ArchiveButton table="non_conformities" id={n.id} archived={n.is_archived} />
          </>
        )}
      />

      <Pagination basePath="/dashboard/non-conformities" page={page} count={count} pageSize={PAGE_SIZE} params={{ q: sp.q, status: sp.status, archived: sp.archived }} />
    </div>
  );
}

function NcForm({ sites, profiles }: { sites: Site[]; profiles: Profile[] }) {
  return (
    <form action={createNonPilotix} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <SubmitButton>Enregistrer la non-conformité</SubmitButton>
      </div>
    </form>
  );
}
