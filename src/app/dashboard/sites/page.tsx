import { requireContext } from "@/lib/queries/auth";
import { getSites, getProfiles, getEntityComplianceMap } from "@/lib/queries/entities";
import { createSite } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel, SubmitButton } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { SiteFields } from "@/components/sites/site-fields";
import { SiteRowActions } from "@/components/sites/site-row-actions";
import { STATUS_LABELS } from "@/lib/status";
import { formatDate } from "@/lib/utils";
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
        showEye={false}
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
        actions={(s) => <SiteRowActions site={s} profiles={profiles} />}
      />

      <Pagination basePath="/dashboard/sites" page={page} count={count} pageSize={PAGE_SIZE} params={{ q: sp.q, archived: sp.archived }} />
    </div>
  );
}

function SiteForm({ profiles }: { profiles: Profile[] }) {
  return (
    <form action={createSite} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <SiteFields profiles={profiles} />
      <div className="sm:col-span-2">
        <SubmitButton>Enregistrer le site</SubmitButton>
      </div>
    </form>
  );
}
