import { requireContext } from "@/lib/queries/auth";
import { getVehicles, getProfiles, getEntityComplianceMap } from "@/lib/queries/entities";
import { createVehicle } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { STATUS_LABELS } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles, comp] = await Promise.all([
    getVehicles(company.id, {
      search: sp.q,
      includeArchived,
      page,
      pageSize: PAGE_SIZE,
    }),
    getProfiles(company.id),
    getEntityComplianceMap(company.id, ["VEHICLE"]),
  ]);

  const profName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };
  const compBadge = (id: string) => {
    const st = comp.get(id)?.status ?? "none";
    return <StatusBadge status={st} label={STATUS_LABELS[st]} />;
  };

  return (
    <div>
      <PageHeader
        title="Véhicules"
        description="Parc de véhicules et suivi de leur conformité."
        action={
          <AddPanel title="Nouveau véhicule">
            <VehicleForm profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/vehicles" search={sp.q} includeArchived={includeArchived} />

      <ListView
        rows={rows}
        getKey={(v) => v.id}
        href={(v) => `/dashboard/vehicles/${v.id}`}
        empty="Aucun véhicule."
        columns={[
          { header: "Immatriculation", cell: (v) => <span className="font-medium">{v.registration_number}</span> },
          { header: "Type", cell: (v) => v.vehicle_type ?? "—" },
          { header: "Conformité", cell: (v) => compBadge(v.id) },
          { header: "Prochaine échéance", cell: (v) => formatDate(comp.get(v.id)?.nextDue ?? null) },
          { header: "Docs manquants", align: "right", cell: (v) => comp.get(v.id)?.missingDocs ?? 0 },
          { header: "Actions en retard", align: "right", cell: (v) => comp.get(v.id)?.lateActions ?? 0 },
          { header: "Responsable", cell: (v) => profName(v.responsible_id) },
          { header: "Superviseur", cell: (v) => profName(v.supervisor_id) },
        ]}
        card={(v) => ({
          title: v.registration_number,
          badge: compBadge(v.id),
          fields: [
            { label: "Prochaine échéance", value: formatDate(comp.get(v.id)?.nextDue ?? null) },
            { label: "Responsable", value: profName(v.responsible_id) },
          ],
        })}
        actions={(v) => <ArchiveButton table="vehicles" id={v.id} archived={v.is_archived} />}
      />

      <Pagination
        basePath="/dashboard/vehicles"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, archived: sp.archived }}
      />
    </div>
  );
}

function VehicleForm({ profiles }: { profiles: Profile[] }) {
  return (
    <form action={createVehicle} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label>Immatriculation</Label>
        <Input name="registration_number" required />
      </div>
      <div>
        <Label>Type</Label>
        <Input name="vehicle_type" />
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
        <Label>Mise en service</Label>
        <Input name="service_date" type="date" />
      </div>
      <div>
        <Label>Statut</Label>
        <Input name="status" defaultValue="actif" />
      </div>
      <div>
        <Label>Responsable</Label>
        <Select name="responsible_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Superviseur</Label>
        <Select name="supervisor_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer le véhicule</Button>
      </div>
    </form>
  );
}
