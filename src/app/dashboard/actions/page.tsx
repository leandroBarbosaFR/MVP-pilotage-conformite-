import { requireContext } from "@/lib/queries/auth";
import { getActions, getObligations, getProfiles } from "@/lib/queries/entities";
import { createAction } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ACTION_STATUS_LABELS,
  PRIORITY_LABELS,
  complianceFromActionStatus,
} from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { Obligation, Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles, obligations] = await Promise.all([
    getActions(company.id, {
      search: sp.q,
      status: sp.status,
      includeArchived,
      page,
      pageSize: PAGE_SIZE,
    }),
    getProfiles(company.id),
    getObligations(company.id, { pageSize: 200 }),
  ]);

  const nameOf = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  return (
    <div>
      <PageHeader
        title="Actions"
        description="Suivi des actions correctives et plans d'action."
        action={
          <AddPanel title="Nouvelle action">
            <ActionForm profiles={profiles} obligations={obligations.rows} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/actions" search={sp.q} includeArchived={includeArchived}>
        <div className="w-40">
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">Tous statuts</option>
            {Object.entries(ACTION_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(a) => a.id}
        href={(a) => `/dashboard/actions/${a.id}`}
        empty="Aucune action."
        columns={[
          { header: "Titre", cell: (a) => <span className="font-medium">{a.title}</span> },
          { header: "Assigné à", cell: (a) => nameOf(a.assigned_to) },
          { header: "Superviseur", cell: (a) => nameOf(a.supervisor_id) },
          { header: "Priorité", cell: (a) => PRIORITY_LABELS[a.priority] },
          { header: "Échéance", cell: (a) => formatDate(a.due_date) },
          { header: "Statut", cell: (a) => <StatusBadge status={complianceFromActionStatus(a.status)} label={ACTION_STATUS_LABELS[a.status]} /> },
        ]}
        card={(a) => ({
          title: a.title,
          badge: <StatusBadge status={complianceFromActionStatus(a.status)} label={ACTION_STATUS_LABELS[a.status]} />,
          fields: [
            { label: "Assigné à", value: nameOf(a.assigned_to) },
            { label: "Échéance", value: formatDate(a.due_date) },
          ],
        })}
        actions={(a) => <ArchiveButton table="actions" id={a.id} archived={a.is_archived} />}
      />

      <Pagination
        basePath="/dashboard/actions"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, status: sp.status, archived: sp.archived }}
      />
    </div>
  );
}

function ActionForm({ profiles, obligations }: { profiles: Profile[]; obligations: Obligation[] }) {
  return (
    <form action={createAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Titre</Label>
        <Input name="title" required />
      </div>
      <div>
        <Label>Statut</Label>
        <Select name="status" defaultValue="TODO">
          {Object.entries(ACTION_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Priorité</Label>
        <Select name="priority" defaultValue="MEDIUM">
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Date d&apos;échéance</Label>
        <Input name="due_date" type="date" />
      </div>
      <div>
        <Label>Catégorie</Label>
        <Input name="category" placeholder="RH, Maintenance, Parc…" />
      </div>
      <div>
        <Label>Assigné à</Label>
        <Select name="assigned_to" defaultValue="">
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
      <div>
        <Label>Obligation liée</Label>
        <Select name="obligation_id" defaultValue="">
          <option value="">Aucune</option>
          {obligations.map((o) => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Textarea name="description" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer l&apos;action</Button>
      </div>
    </form>
  );
}
