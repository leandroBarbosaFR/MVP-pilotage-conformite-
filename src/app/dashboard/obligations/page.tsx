import { requireContext } from "@/lib/queries/auth";
import {
  getObligations,
  getProfiles,
  getEmployees,
  getEquipments,
  getVehicles,
  getSites,
  getProviders,
} from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Select } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { ObligationForm, type EntityOption } from "@/components/obligations/obligation-form";
import {
  CATEGORY_LABELS,
  OBLIGATION_STATUS_LABELS,
  PRIORITY_LABELS,
  complianceFromObligationStatus,
} from "@/lib/status";
import { MODULE_LABELS } from "@/types/enums";
import type { ObligationModule } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function ObligationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; module?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles, employees, equipments, vehicles, sites, providers] = await Promise.all([
    getObligations(company.id, {
      search: sp.q,
      status: sp.status,
      category: sp.category,
      module: sp.module,
      includeArchived,
      page,
      pageSize: PAGE_SIZE,
    }),
    getProfiles(company.id),
    getEmployees(company.id, { pageSize: 500 }),
    getEquipments(company.id, { pageSize: 500 }),
    getVehicles(company.id, { pageSize: 500 }),
    getSites(company.id, { pageSize: 500 }),
    getProviders(company.id, { pageSize: 500 }),
  ]);

  // Résolution du nom de l'entité liée (véhicule / salarié / équipement / site)
  const entMap = new Map<string, string>();
  for (const v of vehicles.rows) entMap.set(v.id, v.registration_number);
  for (const e of employees.rows) entMap.set(e.id, [e.first_name, e.last_name].filter(Boolean).join(" "));
  for (const q of equipments.rows) entMap.set(q.id, q.name);
  for (const s of sites.rows) entMap.set(s.id, s.name);

  // Options pour le sélecteur d'entité liée (formulaire)
  const entities: Record<string, EntityOption[]> = {
    VEHICLE: vehicles.rows.map((v) => ({ id: v.id, label: v.registration_number })),
    EMPLOYEE: employees.rows.map((e) => ({ id: e.id, label: [e.first_name, e.last_name].filter(Boolean).join(" ") })),
    EQUIPMENT: equipments.rows.map((q) => ({ id: q.id, label: q.name })),
    SITE: sites.rows.map((s) => ({ id: s.id, label: s.name })),
  };
  entities.DRIVER = entities.EMPLOYEE;
  const providerOpts: EntityOption[] = providers.rows.map((p) => ({ id: p.id, label: p.name }));

  const profName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  return (
    <div>
      <PageHeader
        title="Contrôles réglementaires"
        description="Vue globale consolidée de toutes les obligations, tous modules confondus."
        action={
          <AddPanel title="Nouvelle obligation">
            <ObligationForm profiles={profiles} providers={providerOpts} entities={entities} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/obligations" search={sp.q} includeArchived={includeArchived}>
        <div className="w-48">
          <Select name="module" defaultValue={sp.module ?? ""}>
            <option value="">Tous modules</option>
            {Object.entries(MODULE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select name="category" defaultValue={sp.category ?? ""}>
            <option value="">Toutes catégories</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">Tous statuts</option>
            {Object.entries(OBLIGATION_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(o) => o.id}
        href={(o) => `/dashboard/obligations/${o.id}`}
        empty="Aucune obligation."
        columns={[
          { header: "Titre", cell: (o) => <span className="font-medium">{o.title}</span> },
          { header: "Module", cell: (o) => <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">{MODULE_LABELS[o.module as ObligationModule] ?? o.module}</span> },
          { header: "Entité liée", cell: (o) => (o.related_entity_id ? entMap.get(o.related_entity_id) ?? "—" : "—") },
          { header: "Responsable", cell: (o) => profName(o.responsible_id) },
          { header: "Échéance", cell: (o) => formatDate(o.due_date) },
          { header: "Priorité", cell: (o) => PRIORITY_LABELS[o.priority] },
          { header: "Statut", cell: (o) => <StatusBadge status={complianceFromObligationStatus(o.status)} label={OBLIGATION_STATUS_LABELS[o.status]} /> },
        ]}
        card={(o) => ({
          title: o.title,
          badge: <StatusBadge status={complianceFromObligationStatus(o.status)} label={OBLIGATION_STATUS_LABELS[o.status]} />,
          fields: [
            { label: "Module", value: MODULE_LABELS[o.module as ObligationModule] ?? o.module },
            { label: "Échéance", value: formatDate(o.due_date) },
          ],
        })}
        actions={(o) => <ArchiveButton table="obligations" id={o.id} archived={o.is_archived} />}
      />

      <Pagination
        basePath="/dashboard/obligations"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, status: sp.status, category: sp.category, module: sp.module, archived: sp.archived }}
      />
    </div>
  );
}
