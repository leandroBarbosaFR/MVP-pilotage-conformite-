import Link from "next/link";
import { requireContext } from "@/lib/queries/auth";
import { getEquipments, getProfiles } from "@/lib/queries/entities";
import { createEquipment } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
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

  const [{ rows, count }, profiles] = await Promise.all([
    getEquipments(company.id, {
      search: sp.q,
      includeArchived,
      page,
      pageSize: PAGE_SIZE,
    }),
    getProfiles(company.id),
  ]);

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

      <Table>
        <THead>
          <TR>
            <TH>Nom</TH>
            <TH>Type</TH>
            <TH>Site</TH>
            <TH>Réf interne</TH>
            <TH>Statut</TH>
            <TH>Actions</TH>
          </TR>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} message="Aucun équipement." />
          ) : (
            rows.map((e) => (
              <TR key={e.id}>
                <TD className="font-medium">
                  <Link href={`/dashboard/equipments/${e.id}`} className="hover:underline">
                    {e.name}
                  </Link>
                </TD>
                <TD>{e.equipment_type}</TD>
                <TD>{e.site}</TD>
                <TD>{e.internal_reference}</TD>
                <TD>{e.status}</TD>
                <TD>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/equipments/${e.id}`}>
                      <Button variant="outline" size="sm">Détail</Button>
                    </Link>
                    <ArchiveButton table="equipments" id={e.id} archived={e.is_archived} />
                  </div>
                </TD>
              </TR>
            ))
          )}
        </tbody>
      </Table>

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
