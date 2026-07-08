import { requireContext } from "@/lib/queries/auth";
import { getSites, getProfiles, getEntityComplianceMap } from "@/lib/queries/entities";
import { createSite } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { STATUS_LABELS } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { SITE_TYPES } from "@/types/enums";
import type { Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles, comp] = await Promise.all([
    getSites(company.id, { search: sp.q, includeArchived, page, pageSize: PAGE_SIZE }),
    getProfiles(company.id),
    getEntityComplianceMap(company.id, ["SITE"]),
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
        title="Sites et installations"
        description="Bâtiments, entrepôts, ateliers, dépôts et zones — et leurs obligations de conformité."
        action={
          <AddPanel title="Nouveau site">
            <SiteForm profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/sites" search={sp.q} includeArchived={includeArchived} />

      <ListView
        rows={rows}
        getKey={(s) => s.id}
        href={(s) => `/dashboard/sites/${s.id}`}
        empty="Aucun site."
        columns={[
          { header: "Nom", cell: (s) => <span className="font-medium">{s.name}</span> },
          { header: "Ville", cell: (s) => s.city ?? "—" },
          { header: "Type", cell: (s) => s.site_type ?? "—" },
          { header: "Conformité", cell: (s) => compBadge(s.id) },
          { header: "Prochaine échéance", cell: (s) => formatDate(comp.get(s.id)?.nextDue ?? null) },
          { header: "Docs manquants", align: "right", cell: (s) => comp.get(s.id)?.missingDocs ?? 0 },
          { header: "Actions en retard", align: "right", cell: (s) => comp.get(s.id)?.lateActions ?? 0 },
          { header: "Responsable", cell: (s) => profName(s.manager_id) },
          { header: "Superviseur", cell: (s) => profName(s.supervisor_id) },
        ]}
        card={(s) => ({
          title: s.name,
          badge: compBadge(s.id),
          fields: [
            { label: "Prochaine échéance", value: formatDate(comp.get(s.id)?.nextDue ?? null) },
            { label: "Responsable", value: profName(s.manager_id) },
          ],
        })}
        actions={(s) => <ArchiveButton table="sites" id={s.id} archived={s.is_archived} />}
      />

      <Pagination basePath="/dashboard/sites" page={page} count={count} pageSize={PAGE_SIZE} params={{ q: sp.q, archived: sp.archived }} />
    </div>
  );
}

function SiteForm({ profiles }: { profiles: Profile[] }) {
  return (
    <form action={createSite} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Nom</Label>
        <Input name="name" required />
      </div>
      <div>
        <Label>Type de site</Label>
        <Select name="site_type" defaultValue={SITE_TYPES[0]}>
          {SITE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>
      <div>
        <Label>Type d&apos;activité</Label>
        <Input name="activity_type" />
      </div>
      <div>
        <Label>Adresse</Label>
        <Input name="address" />
      </div>
      <div>
        <Label>Ville</Label>
        <Input name="city" />
      </div>
      <div>
        <Label>Code postal</Label>
        <Input name="postal_code" />
      </div>
      <div>
        <Label>Pays</Label>
        <Input name="country" defaultValue="France" />
      </div>
      <div>
        <Label>Surface (m²)</Label>
        <Input name="surface_area" type="number" />
      </div>
      <div>
        <Label>Responsable du site</Label>
        <Select name="manager_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Superviseur</Label>
        <Select name="supervisor_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Notes</Label>
        <Textarea name="notes" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer le site</Button>
      </div>
    </form>
  );
}
