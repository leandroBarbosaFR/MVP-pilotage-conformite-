import Link from "next/link";
import { requireContext } from "@/lib/queries/auth";
import { getObligations, getProfiles } from "@/lib/queries/entities";
import { createObligation } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CATEGORY_LABELS,
  FREQUENCY_LABELS,
  OBLIGATION_STATUS_LABELS,
  PRIORITY_LABELS,
  complianceFromObligationStatus,
} from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;

export default async function ObligationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles] = await Promise.all([
    getObligations(company.id, {
      search: sp.q,
      status: sp.status,
      category: sp.category,
      includeArchived,
      page,
      pageSize: PAGE_SIZE,
    }),
    getProfiles(company.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Obligations"
        description="Suivi générique de toute obligation ou échéance de conformité."
        action={
          <AddPanel title="Nouvelle obligation">
            <ObligationForm profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/obligations" search={sp.q} includeArchived={includeArchived}>
        <div className="w-40">
          <Select name="category" defaultValue={sp.category ?? ""}>
            <option value="">Toutes catégories</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">Tous statuts</option>
            {Object.entries(OBLIGATION_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
      </ListToolbar>

      <Table>
        <THead>
          <TR>
            <TH>Titre</TH>
            <TH>Catégorie</TH>
            <TH>Échéance</TH>
            <TH>Priorité</TH>
            <TH>Statut</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} message="Aucune obligation." />
          ) : (
            rows.map((o) => (
              <TR key={o.id}>
                <TD className="font-medium">
                  <Link href={`/dashboard/obligations/${o.id}`} className="hover:underline">
                    {o.title}
                  </Link>
                </TD>
                <TD>{CATEGORY_LABELS[o.category]}</TD>
                <TD>{formatDate(o.due_date)}</TD>
                <TD>{PRIORITY_LABELS[o.priority]}</TD>
                <TD>
                  <StatusBadge status={complianceFromObligationStatus(o.status)} label={OBLIGATION_STATUS_LABELS[o.status]} />
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <Link href={`/dashboard/obligations/${o.id}`}>
                      <Button variant="outline" size="sm">Détail</Button>
                    </Link>
                    <ArchiveButton table="obligations" id={o.id} archived={o.is_archived} />
                  </div>
                </TD>
              </TR>
            ))
          )}
        </tbody>
      </Table>

      <Pagination
        basePath="/dashboard/obligations"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, status: sp.status, category: sp.category, archived: sp.archived }}
      />
    </div>
  );
}

function ObligationForm({ profiles }: { profiles: Profile[] }) {
  return (
    <form action={createObligation} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Titre</Label>
        <Input name="title" required />
      </div>
      <div>
        <Label>Catégorie</Label>
        <Select name="category" defaultValue="autre">
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Date d&apos;échéance</Label>
        <Input name="due_date" type="date" />
      </div>
      <div>
        <Label>Fréquence</Label>
        <Select name="frequency" defaultValue="unique">
          {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
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
        <Label>Statut</Label>
        <Select name="status" defaultValue="COMPLIANT">
          {Object.entries(OBLIGATION_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
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
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Textarea name="description" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer l&apos;obligation</Button>
      </div>
    </form>
  );
}
