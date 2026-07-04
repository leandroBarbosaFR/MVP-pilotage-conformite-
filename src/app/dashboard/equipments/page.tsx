import { requireContext } from "@/lib/queries/auth";
import { getEquipments, getProfiles, getEntityComplianceMap } from "@/lib/queries/entities";
import { createEquipment } from "@/lib/actions/entities";
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

export default async function EquipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles, comp] = await Promise.all([
    getEquipments(company.id, {
      search: sp.q,
      includeArchived,
      page,
      pageSize: PAGE_SIZE,
    }),
    getProfiles(company.id),
    getEntityComplianceMap(company.id, ["EQUIPMENT"]),
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
        title="Équipements"
        description="Inventaire des équipements et suivi de leur conformité."
        action={
          <AddPanel title="Nouvel équipement">
            <EquipmentForm profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/equipments" search={sp.q} includeArchived={includeArchived} />

      <ListView
        rows={rows}
        getKey={(e) => e.id}
        href={(e) => `/dashboard/equipments/${e.id}`}
        empty="Aucun équipement."
        columns={[
          { header: "Nom", cell: (e) => <span className="font-medium">{e.name}</span> },
          { header: "Site", cell: (e) => e.site ?? "—" },
          { header: "Conformité", cell: (e) => compBadge(e.id) },
          { header: "Prochaine échéance", cell: (e) => formatDate(comp.get(e.id)?.nextDue ?? null) },
          { header: "Docs manquants", align: "right", cell: (e) => comp.get(e.id)?.missingDocs ?? 0 },
          { header: "Actions en retard", align: "right", cell: (e) => comp.get(e.id)?.lateActions ?? 0 },
          { header: "Responsable", cell: (e) => profName(e.responsible_id) },
          { header: "Superviseur", cell: (e) => profName(e.supervisor_id) },
        ]}
        card={(e) => ({
          title: e.name,
          badge: compBadge(e.id),
          fields: [
            { label: "Prochaine échéance", value: formatDate(comp.get(e.id)?.nextDue ?? null) },
            { label: "Responsable", value: profName(e.responsible_id) },
          ],
        })}
        actions={(e) => <ArchiveButton table="equipments" id={e.id} archived={e.is_archived} />}
      />

      <Pagination
        basePath="/dashboard/equipments"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, archived: sp.archived }}
      />
    </div>
  );
}

function EquipmentForm({ profiles }: { profiles: Profile[] }) {
  return (
    <form action={createEquipment} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label>Nom</Label>
        <Input name="name" required />
      </div>
      <div>
        <Label>Type</Label>
        <Input name="equipment_type" />
      </div>
      <div>
        <Label>Site</Label>
        <Input name="site" />
      </div>
      <div>
        <Label>Réf interne</Label>
        <Input name="internal_reference" />
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
        <Button type="submit">Enregistrer l&apos;équipement</Button>
      </div>
    </form>
  );
}
