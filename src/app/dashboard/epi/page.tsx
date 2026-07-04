import Link from "next/link";
import { requireContext } from "@/lib/queries/auth";
import { getEpis, getEmployees, getEmployeeNames, getProfiles } from "@/lib/queries/entities";
import { createEpi } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { statusFromDate, STATUS_LABELS, EPI_TYPES } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { Employee, Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;

export default async function EpiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, employees, names, profiles] = await Promise.all([
    getEpis(company.id, { search: sp.q, includeArchived, page, pageSize: PAGE_SIZE }),
    getEmployees(company.id, { pageSize: 500 }),
    getEmployeeNames(company.id),
    getProfiles(company.id),
  ]);

  return (
    <div>
      <PageHeader
        title="EPI"
        description="Équipements de protection individuelle et suivi des dates de renouvellement."
        action={
          <AddPanel title="Nouvel EPI">
            <EpiForm employees={employees.rows} profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/epi" search={sp.q} includeArchived={includeArchived} />

      <Table>
        <THead>
          <TR>
            <TH>Type</TH>
            <TH>Référence</TH>
            <TH>Assigné à</TH>
            <TH>Date de remise</TH>
            <TH>Renouvellement</TH>
            <TH>Statut</TH>
            <TH>Actions</TH>
          </TR>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={7} message="Aucun EPI." />
          ) : (
            rows.map((e) => (
              <TR key={e.id}>
                <TD className="font-medium">
                  <Link href={`/dashboard/epi/${e.id}`} className="hover:underline">
                    {e.epi_type}
                  </Link>
                </TD>
                <TD>{e.internal_reference ?? "—"}</TD>
                <TD>{e.assigned_employee_id ? names.get(e.assigned_employee_id) ?? "—" : "—"}</TD>
                <TD>{formatDate(e.issue_date)}</TD>
                <TD>{formatDate(e.renewal_date)}</TD>
                <TD>
                  <StatusBadge
                    status={statusFromDate(e.renewal_date)}
                    label={STATUS_LABELS[statusFromDate(e.renewal_date)]}
                  />
                </TD>
                <TD>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/epi/${e.id}`}>
                      <Button variant="outline" size="sm">Détail</Button>
                    </Link>
                    <ArchiveButton table="epi" id={e.id} archived={e.is_archived} />
                  </div>
                </TD>
              </TR>
            ))
          )}
        </tbody>
      </Table>

      <Pagination
        basePath="/dashboard/epi"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, archived: sp.archived }}
      />
    </div>
  );
}

function EpiForm({ employees, profiles }: { employees: Employee[]; profiles: Profile[] }) {
  return (
    <form action={createEpi} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label>Type</Label>
        <Select name="epi_type" defaultValue={EPI_TYPES[0]}>
          {EPI_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Référence interne</Label>
        <Input name="internal_reference" />
      </div>
      <div>
        <Label>Personne assignée</Label>
        <Select name="assigned_employee_id" defaultValue="">
          <option value="">Non assigné</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {[e.first_name, e.last_name].filter(Boolean).join(" ")}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Statut</Label>
        <Input name="status" defaultValue="actif" />
      </div>
      <div>
        <Label>Date de remise</Label>
        <Input name="issue_date" type="date" />
      </div>
      <div>
        <Label>Date de renouvellement</Label>
        <Input name="renewal_date" type="date" />
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
        <Button type="submit">Enregistrer l&apos;EPI</Button>
      </div>
    </form>
  );
}
