import { requireContext } from "@/lib/queries/auth";
import {
  getActions,
  getObligations,
  getProfiles,
  getVehicles,
  getEmployees,
  getEquipments,
  getSites,
  getEntityNameMap,
} from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { AiActionLink } from "@/components/ai/ai-action-link";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Select } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionForm, type EntityOption } from "@/components/actions/action-form";
import {
  ACTION_STATUS_LABELS,
  PRIORITY_LABELS,
  complianceFromActionStatus,
} from "@/lib/status";
import { RELATED_ENTITY_LABELS } from "@/types/enums";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles, obligations, employees, equipments, vehicles, sites, entMap] =
    await Promise.all([
      getActions(company.id, {
        search: sp.q,
        status: sp.status,
        includeArchived,
        page,
        pageSize: PAGE_SIZE,
      }),
      getProfiles(company.id),
      getObligations(company.id, { pageSize: 200 }),
      getEmployees(company.id, { pageSize: 500 }),
      getEquipments(company.id, { pageSize: 500 }),
      getVehicles(company.id, { pageSize: 500 }),
      getSites(company.id, { pageSize: 500 }),
      getEntityNameMap(company.id),
    ]);

  // Options pour le sélecteur d'entité liée (formulaire)
  const entities: Record<string, EntityOption[]> = {
    VEHICLE: vehicles.rows.map((v) => ({ id: v.id, label: v.registration_number })),
    EMPLOYEE: employees.rows.map((e) => ({ id: e.id, label: [e.first_name, e.last_name].filter(Boolean).join(" ") })),
    EQUIPMENT: equipments.rows.map((q) => ({ id: q.id, label: q.name })),
    SITE: sites.rows.map((s) => ({ id: s.id, label: s.name })),
  };
  entities.DRIVER = entities.EMPLOYEE;

  const nameOf = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  const relatedEntityLabel = (a: (typeof rows)[number]) =>
    a.related_entity_id
      ? `${RELATED_ENTITY_LABELS[a.related_entity_type as keyof typeof RELATED_ENTITY_LABELS] ?? ""} ${entMap.get(a.related_entity_id) ?? "—"}`.trim()
      : "—";

  return (
    <div>
      <PageHeader
        title="Actions"
        description="Suivi des actions correctives et plans d'action."
        action={
          <>
            <AiActionLink action="prioritize-actions" label="Prioriser (IA)" />
            <AddPanel title="Nouvelle action">
              <ActionForm profiles={profiles} obligations={obligations.rows} entities={entities} />
            </AddPanel>
          </>
        }
      />

      <ListToolbar basePath="/dashboard/actions" search={sp.q} includeArchived={includeArchived}>
        <div className="w-40">
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">Tous statuts</option>
            {Object.entries(ACTION_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(a) => a.id}
        href={(a) => `/dashboard/actions/${a.id}`}
        empty="Aucune action."
        columns={[
          { header: "Titre", cell: (a) => <span className="font-medium">{a.title}</span> },
          { header: "Entité liée", cell: (a) => relatedEntityLabel(a) },
          { header: "Source", cell: (a) => a.source ?? "—" },
          { header: "Assigné à", cell: (a) => nameOf(a.assigned_to) },
          { header: "Priorité", cell: (a) => PRIORITY_LABELS[a.priority] },
          { header: "Échéance", cell: (a) => formatDate(a.due_date) },
          { header: "Statut", cell: (a) => <StatusBadge status={complianceFromActionStatus(a.status)} label={ACTION_STATUS_LABELS[a.status]} /> },
        ]}
        card={(a) => ({
          title: a.title,
          badge: <StatusBadge status={complianceFromActionStatus(a.status)} label={ACTION_STATUS_LABELS[a.status]} />,
          fields: [
            { label: "Entité liée", value: relatedEntityLabel(a) },
            { label: "Échéance", value: formatDate(a.due_date) },
          ],
        })}
        actions={(a) => <ArchiveButton table="actions" id={a.id} archived={a.is_archived} />}
      />

      <Pagination
        basePath="/dashboard/actions"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, status: sp.status, archived: sp.archived }}
      />
    </div>
  );
}
