import Link from "next/link";
import { requireContext } from "@/lib/queries/auth";
import { getSites, getProfiles } from "@/lib/queries/entities";
import { createSite } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
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

  const [{ rows, count }, profiles] = await Promise.all([
    getSites(company.id, { search: sp.q, includeArchived, page, pageSize: PAGE_SIZE }),
    getProfiles(company.id),
  ]);

  const profName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  return (
    <div>
      <PageHeader
        title="Sites et locaux"
        description="Bâtiments, entrepôts, ateliers, dépôts et zones — et leurs obligations de conformité."
        action={
          <AddPanel title="Nouveau site">
            <SiteForm profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/sites" search={sp.q} includeArchived={includeArchived} />

      <Table>
        <THead>
          <TR>
            <TH>Nom</TH>
            <TH>Type</TH>
            <TH>Ville</TH>
            <TH>Responsable</TH>
            <TH>Statut</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} message="Aucun site." />
          ) : (
            rows.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium">
                  <Link href={`/dashboard/sites/${s.id}`} className="hover:underline">{s.name}</Link>
                </TD>
                <TD>{s.site_type ?? "—"}</TD>
                <TD>{s.city ?? "—"}</TD>
                <TD>{profName(s.manager_id)}</TD>
                <TD>{s.status}</TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <Link href={`/dashboard/sites/${s.id}`}>
                      <Button variant="outline" size="sm">Détail</Button>
                    </Link>
                    <ArchiveButton table="sites" id={s.id} archived={s.is_archived} />
                  </div>
                </TD>
              </TR>
            ))
          )}
        </tbody>
      </Table>

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
