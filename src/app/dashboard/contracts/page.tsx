import { requireContext } from "@/lib/queries/auth";
import { getContracts, getProviders, getSites, getProfiles } from "@/lib/queries/entities";
import { createContract } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { CONTRACT_TYPES, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_TONE } from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus, Provider, Site, Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, providers, sites, profiles] = await Promise.all([
    getContracts(company.id, { search: sp.q, status: sp.status, includeArchived, page, pageSize: PAGE_SIZE }),
    getProviders(company.id, { pageSize: 500 }),
    getSites(company.id, { pageSize: 500 }),
    getProfiles(company.id),
  ]);

  const provName = (id: string | null) => providers.rows.find((p) => p.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader
        title="Contrats"
        description="Assurances, maintenance, baux et prestations — avec échéances et préavis."
        action={
          <AddPanel title="Nouveau contrat">
            <ContractForm providers={providers.rows} sites={sites.rows} profiles={profiles} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/contracts" search={sp.q} includeArchived={includeArchived}>
        <div className="w-40">
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">Tous statuts</option>
            {Object.entries(CONTRACT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
      </ListToolbar>

      <Table>
        <THead>
          <TR>
            <TH>Titre</TH>
            <TH>Type</TH>
            <TH>Prestataire</TH>
            <TH>Renouvellement</TH>
            <TH>Statut</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} message="Aucun contrat." />
          ) : (
            rows.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.title}</TD>
                <TD>{c.contract_type ?? "—"}</TD>
                <TD>{provName(c.provider_id)}</TD>
                <TD>{formatDate(c.renewal_date)}</TD>
                <TD>
                  <StatusBadge status={(CONTRACT_STATUS_TONE[c.status] ?? "none") as ComplianceStatus} label={CONTRACT_STATUS_LABELS[c.status] ?? c.status} />
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    <ArchiveButton table="contracts" id={c.id} archived={c.is_archived} />
                  </div>
                </TD>
              </TR>
            ))
          )}
        </tbody>
      </Table>

      <Pagination basePath="/dashboard/contracts" page={page} count={count} pageSize={PAGE_SIZE} params={{ q: sp.q, status: sp.status, archived: sp.archived }} />
    </div>
  );
}

function ContractForm({ providers, sites, profiles }: { providers: Provider[]; sites: Site[]; profiles: Profile[] }) {
  return (
    <form action={createContract} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Titre</Label>
        <Input name="title" required />
      </div>
      <div>
        <Label>Type de contrat</Label>
        <Select name="contract_type" defaultValue={CONTRACT_TYPES[0]}>
          {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>
      <div>
        <Label>Statut</Label>
        <Select name="status" defaultValue="ACTIVE">
          {Object.entries(CONTRACT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
        <Label>Site</Label>
        <Select name="site_id" defaultValue="">
          <option value="">Aucun</option>
          {sites.map((sx) => <option key={sx.id} value={sx.id}>{sx.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Date de début</Label>
        <Input name="start_date" type="date" />
      </div>
      <div>
        <Label>Date de fin</Label>
        <Input name="end_date" type="date" />
      </div>
      <div>
        <Label>Date de renouvellement</Label>
        <Input name="renewal_date" type="date" />
      </div>
      <div>
        <Label>Préavis (jours)</Label>
        <Input name="notice_period_days" type="number" />
      </div>
      <div>
        <Label>Montant (€)</Label>
        <Input name="amount" type="number" />
      </div>
      <div>
        <Label>Responsable</Label>
        <Select name="responsible_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>)}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer le contrat</Button>
      </div>
    </form>
  );
}
