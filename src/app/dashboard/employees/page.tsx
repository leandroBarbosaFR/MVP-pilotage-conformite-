import { requireContext } from "@/lib/queries/auth";
import { getEmployees, getProfiles } from "@/lib/queries/entities";
import { createEmployee } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import type { Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles] = await Promise.all([
    getEmployees(company.id, {
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
        title="Salariés"
        description="Suivi des salariés et de leurs échéances de conformité."
        action={
          <AddPanel title="Nouveau salarié">
            <EmployeeForm profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/employees" search={sp.q} includeArchived={includeArchived} />

      <ListView
        rows={rows}
        getKey={(e) => e.id}
        href={(e) => `/dashboard/employees/${e.id}`}
        empty="Aucun salarié."
        columns={[
          { header: "Nom", cell: (e) => <span className="font-medium">{[e.last_name, e.first_name].filter(Boolean).join(" ")}</span> },
          { header: "Poste", cell: (e) => e.job_title ?? "—" },
          { header: "Email", cell: (e) => e.email ?? "—" },
          { header: "Téléphone", cell: (e) => e.phone ?? "—" },
          { header: "Statut", cell: (e) => e.status },
        ]}
        card={(e) => ({
          title: [e.last_name, e.first_name].filter(Boolean).join(" "),
          fields: [
            { label: "Poste", value: e.job_title ?? "—" },
            { label: "Statut", value: e.status },
          ],
        })}
        actions={(e) => <ArchiveButton table="employees" id={e.id} archived={e.is_archived} />}
      />

      <Pagination
        basePath="/dashboard/employees"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, archived: sp.archived }}
      />
    </div>
  );
}

function EmployeeForm({ profiles }: { profiles: Profile[] }) {
  return (
    <form action={createEmployee} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label>Prénom</Label>
        <Input name="first_name" required />
      </div>
      <div>
        <Label>Nom</Label>
        <Input name="last_name" required />
      </div>
      <div>
        <Label>Poste</Label>
        <Input name="job_title" />
      </div>
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" />
      </div>
      <div>
        <Label>Téléphone</Label>
        <Input name="phone" />
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
        <Button type="submit">Enregistrer le salarié</Button>
      </div>
    </form>
  );
}
