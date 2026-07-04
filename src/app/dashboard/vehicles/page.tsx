import Link from "next/link";
import { requireContext } from "@/lib/queries/auth";
import { getVehicles, getProfiles } from "@/lib/queries/entities";
import { createVehicle } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
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

  const [{ rows, count }, profiles] = await Promise.all([
    getVehicles(company.id, {
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
        title="Véhicules"
        description="Parc de véhicules et suivi de leur conformité."
        action={
          <AddPanel title="Nouveau véhicule">
            <VehicleForm profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/vehicles" search={sp.q} includeArchived={includeArchived} />

      <Table>
        <THead>
          <TR>
            <TH>Immatriculation</TH>
            <TH>Type</TH>
            <TH>Marque</TH>
            <TH>Modèle</TH>
            <TH>Mise en service</TH>
            <TH>Statut</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={7} message="Aucun véhicule." />
          ) : (
            rows.map((v) => (
              <TR key={v.id}>
                <TD className="font-medium">
                  <Link href={`/dashboard/vehicles/${v.id}`} className="hover:underline">
                    {v.registration_number}
                  </Link>
                </TD>
                <TD>{v.vehicle_type}</TD>
                <TD>{v.brand}</TD>
                <TD>{v.model}</TD>
                <TD>{formatDate(v.service_date)}</TD>
                <TD>{v.status}</TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <Link href={`/dashboard/vehicles/${v.id}`}>
                      <Button variant="outline" size="sm">Détail</Button>
                    </Link>
                    <ArchiveButton table="vehicles" id={v.id} archived={v.is_archived} />
                  </div>
                </TD>
              </TR>
            ))
          )}
        </tbody>
      </Table>

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
