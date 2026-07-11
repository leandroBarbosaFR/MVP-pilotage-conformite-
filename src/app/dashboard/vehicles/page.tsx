import { requireContext } from "@/lib/queries/auth";
import {
  getVehicles,
  getProfiles,
  getEntityComplianceMap,
  getSiteOptions,
  getEmployeeNames,
} from "@/lib/queries/entities";
import { createVehicle } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel, SubmitButton } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Input, Label, Select } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { STATUS_LABELS, statusFromDate } from "@/lib/status";
import { PRIORITY_LABELS, PriorityLevel } from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string; page?: string; site?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles, comp, sites, empNames] = await Promise.all([
    getVehicles(company.id, { search: sp.q, site: sp.site, includeArchived, page, pageSize: PAGE_SIZE }),
    getProfiles(company.id),
    getEntityComplianceMap(company.id, ["VEHICLE"]),
    getSiteOptions(company.id),
    getEmployeeNames(company.id),
  ]);

  const siteName = (id: string | null) => (id ? sites.find((s) => s.id === id)?.name ?? "—" : "—");
  const profName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };
  const compBadge = (id: string) => {
    const st = comp.get(id)?.status ?? "none";
    return <StatusBadge status={st} label={STATUS_LABELS[st]} />;
  };
  const dateBadge = (date: string | null) =>
    date ? <StatusBadge status={statusFromDate(date)} label={formatDate(date)} /> : <span className="text-muted-foreground">—</span>;

  return (
    <div>
      <PageHeader
        title="Véhicules et flotte"
        description="Flotte, échéances (contrôle technique, assurance, entretien), documents et conducteurs associés."
        action={
          <AddPanel title="Nouveau véhicule">
            <VehicleForm profiles={profiles} sites={sites} empNames={empNames} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/vehicles" search={sp.q} includeArchived={includeArchived}>
        {sites.length > 0 ? (
          <Select name="site" defaultValue={sp.site ?? ""} className="w-44">
            <option value="">Tous les sites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        ) : null}
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(v) => v.id}
        href={(v) => `/dashboard/vehicles/${v.id}`}
        empty="Aucun véhicule."
        columns={[
          { header: "Immatriculation", cell: (v) => <span className="font-medium">{v.registration_number}</span> },
          { header: "Type", cell: (v) => v.vehicle_type ?? "—" },
          { header: "Site", cell: (v) => siteName(v.site_id) },
          { header: "Contrôle technique", cell: (v) => dateBadge(v.technical_inspection_expiry) },
          { header: "Assurance", cell: (v) => dateBadge(v.insurance_expiry) },
          { header: "Conformité", cell: (v) => compBadge(v.id) },
          { header: "Responsable parc", cell: (v) => profName(v.fleet_manager_id ?? v.responsible_id) },
        ]}
        card={(v) => ({
          title: v.registration_number,
          badge: compBadge(v.id),
          fields: [
            { label: "Type", value: v.vehicle_type ?? "—" },
            { label: "Site", value: siteName(v.site_id) },
            { label: "Contrôle technique", value: formatDate(v.technical_inspection_expiry) },
            { label: "Assurance", value: formatDate(v.insurance_expiry) },
          ],
        })}
        actions={(v) => <ArchiveButton table="vehicles" id={v.id} archived={v.is_archived} />}
      />

      <Pagination
        basePath="/dashboard/vehicles"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, archived: sp.archived, site: sp.site }}
      />
    </div>
  );
}

function VehicleForm({
  profiles,
  sites,
  empNames,
}: {
  profiles: Profile[];
  sites: { id: string; name: string }[];
  empNames: Map<string, string>;
}) {
  const profOptions = profiles.map((p) => (
    <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>
  ));
  const driverOptions = Array.from(empNames.entries()).map(([id, name]) => (
    <option key={id} value={id}>{name}</option>
  ));
  return (
    <form action={createVehicle} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label>Immatriculation</Label>
        <Input name="registration_number" required />
      </div>
      <div>
        <Label>Type</Label>
        <Input name="vehicle_type" placeholder="Poids lourd, utilitaire…" />
      </div>
      <div>
        <Label>Marque</Label>
        <Input name="brand" />
      </div>
      <div>
        <Label>Modèle</Label>
        <Input name="model" />
      </div>
      <div>
        <Label>Site / agence</Label>
        <Select name="site_id" defaultValue="">
          <option value="">Non assigné</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Conducteur principal</Label>
        <Select name="main_driver_id" defaultValue="">
          <option value="">Non assigné</option>
          {driverOptions}
        </Select>
      </div>
      <div>
        <Label>Contrôle technique (expiration)</Label>
        <Input name="technical_inspection_expiry" type="date" />
      </div>
      <div>
        <Label>Assurance (expiration)</Label>
        <Input name="insurance_expiry" type="date" />
      </div>
      <div>
        <Label>Prochain entretien</Label>
        <Input name="next_maintenance" type="date" />
      </div>
      <div>
        <Label>Tachygraphe (expiration)</Label>
        <Input name="tachograph_expiry" type="date" />
      </div>
      <div>
        <Label>Extincteur (expiration)</Label>
        <Input name="extinguisher_expiry" type="date" />
      </div>
      <div>
        <Label>Kilométrage</Label>
        <Input name="mileage" type="number" />
      </div>
      <div>
        <Label>Mise en service</Label>
        <Input name="service_date" type="date" />
      </div>
      <div>
        <Label>Priorité</Label>
        <Select name="priority" defaultValue={PriorityLevel.MEDIUM}>
          {Object.values(PriorityLevel).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </Select>
      </div>
      <div>
        <Label>Responsable parc</Label>
        <Select name="fleet_manager_id" defaultValue="">
          <option value="">Non assigné</option>
          {profOptions}
        </Select>
      </div>
      <div>
        <Label>Statut</Label>
        <Input name="status" defaultValue="actif" />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>Enregistrer le véhicule</SubmitButton>
      </div>
    </form>
  );
}
