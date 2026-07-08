import { requireContext } from "@/lib/queries/auth";
import {
  getEquipments,
  getProfiles,
  getEntityComplianceMap,
  getSiteOptions,
  getProviders,
} from "@/lib/queries/entities";
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
import { STATUS_LABELS, statusFromDate, FREQUENCY_LABELS } from "@/lib/status";
import { PRIORITY_LABELS, PriorityLevel } from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { Profile, Provider } from "@/lib/types/database";

const PAGE_SIZE = 20;

export default async function EquipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string; page?: string; site?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles, comp, sites, providersRes] = await Promise.all([
    getEquipments(company.id, { search: sp.q, site: sp.site, includeArchived, page, pageSize: PAGE_SIZE }),
    getProfiles(company.id),
    getEntityComplianceMap(company.id, ["EQUIPMENT"]),
    getSiteOptions(company.id),
    getProviders(company.id, { pageSize: 200 }),
  ]);

  const siteName = (e: { site_id: string | null; site: string | null }) =>
    e.site_id ? sites.find((s) => s.id === e.site_id)?.name ?? e.site ?? "—" : e.site ?? "—";
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
        title="Équipements et engins"
        description="Chariots, transpalettes, engins de levage, racks, quais et équipements de sécurité — et leurs contrôles périodiques."
        action={
          <AddPanel title="Nouvel équipement">
            <EquipmentForm profiles={profiles} sites={sites} providers={providersRes.rows} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/equipments" search={sp.q} includeArchived={includeArchived}>
        {sites.length > 0 ? (
          <Select name="site" defaultValue={sp.site ?? ""} className="w-44">
            <option value="">Tous les sites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        ) : null}
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(e) => e.id}
        href={(e) => `/dashboard/equipments/${e.id}`}
        empty="Aucun équipement."
        columns={[
          { header: "Nom", cell: (e) => <span className="font-medium">{e.name}</span> },
          { header: "Catégorie", cell: (e) => e.category ?? e.equipment_type ?? "—" },
          { header: "Site / zone", cell: (e) => siteName(e) },
          { header: "Prochain contrôle", cell: (e) => dateBadge(e.next_check_date) },
          { header: "Conformité", cell: (e) => compBadge(e.id) },
          { header: "Responsable", cell: (e) => profName(e.responsible_id) },
        ]}
        card={(e) => ({
          title: e.name,
          badge: compBadge(e.id),
          fields: [
            { label: "Catégorie", value: e.category ?? e.equipment_type ?? "—" },
            { label: "Site / zone", value: siteName(e) },
            { label: "Prochain contrôle", value: formatDate(e.next_check_date) },
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
        params={{ q: sp.q, archived: sp.archived, site: sp.site }}
      />
    </div>
  );
}

function EquipmentForm({
  profiles,
  sites,
  providers,
}: {
  profiles: Profile[];
  sites: { id: string; name: string }[];
  providers: Provider[];
}) {
  return (
    <form action={createEquipment} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label>Nom</Label>
        <Input name="name" required />
      </div>
      <div>
        <Label>Catégorie</Label>
        <Input name="category" placeholder="Chariot élévateur, transpalette, pont roulant…" />
      </div>
      <div>
        <Label>Type</Label>
        <Input name="equipment_type" placeholder="Levage, manutention…" />
      </div>
      <div>
        <Label>N° de série</Label>
        <Input name="serial_number" />
      </div>
      <div>
        <Label>Réf interne</Label>
        <Input name="internal_reference" />
      </div>
      <div>
        <Label>Site / zone</Label>
        <Select name="site_id" defaultValue="">
          <option value="">Non assigné</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Dernier contrôle</Label>
        <Input name="last_check_date" type="date" />
      </div>
      <div>
        <Label>Prochain contrôle</Label>
        <Input name="next_check_date" type="date" />
      </div>
      <div>
        <Label>Fréquence</Label>
        <Select name="frequency" defaultValue="annuelle">
          {Object.entries(FREQUENCY_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </Select>
      </div>
      <div>
        <Label>Prestataire</Label>
        <Select name="provider_id" defaultValue="">
          <option value="">Aucun</option>
          {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Priorité</Label>
        <Select name="priority" defaultValue={PriorityLevel.MEDIUM}>
          {Object.values(PriorityLevel).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </Select>
      </div>
      <div>
        <Label>Responsable</Label>
        <Select name="responsible_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>)}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer l&apos;équipement</Button>
      </div>
    </form>
  );
}
