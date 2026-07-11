import Link from "next/link";
import { requireContext } from "@/lib/queries/auth";
import {
  getEmployees,
  getProfiles,
  getEntityComplianceMap,
  getCertSummaryMap,
  getSiteOptions,
} from "@/lib/queries/entities";
import { createEmployee } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { STATUS_LABELS } from "@/lib/status";
import {
  JOB_FAMILIES,
  EMPLOYEE_CONTRACT_TYPES,
  WORK_STATUS_OPTIONS,
  WORK_STATUS_LABELS,
} from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

const PAGE_SIZE = 20;
const TONE_RANK: Record<string, number> = { none: 0, ok: 1, warn: 2, danger: 3 };

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    archived?: string;
    page?: string;
    status?: string;
    site?: string;
    contract?: string;
  }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles, comp, certs, sites] = await Promise.all([
    getEmployees(company.id, {
      search: sp.q,
      status: sp.status,
      site: sp.site,
      contractType: sp.contract,
      includeArchived,
      page,
      pageSize: PAGE_SIZE,
    }),
    getProfiles(company.id),
    getEntityComplianceMap(company.id, ["EMPLOYEE", "DRIVER"]),
    getCertSummaryMap(company.id),
    getSiteOptions(company.id),
  ]);

  const siteName = (id: string | null) => (id ? sites.find((s) => s.id === id)?.name ?? "—" : "—");
  const profName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  const combinedTone = (id: string) => {
    const a = comp.get(id)?.status ?? "none";
    const b = certs.get(id)?.status ?? "none";
    return TONE_RANK[a] >= TONE_RANK[b] ? a : b;
  };
  const nextDue = (id: string) => {
    const a = comp.get(id)?.nextDue ?? null;
    const b = certs.get(id)?.nextDue ?? null;
    if (a && b) return a < b ? a : b;
    return a ?? b;
  };
  const compBadge = (id: string) => {
    const st = combinedTone(id);
    return <StatusBadge status={st} label={STATUS_LABELS[st]} />;
  };
  const certLabel = (id: string) => {
    const c = certs.get(id);
    if (!c || c.total === 0) return "—";
    const parts: string[] = [];
    if (c.expired) parts.push(`${c.expired} expirée${c.expired > 1 ? "s" : ""}`);
    if (c.expiring) parts.push(`${c.expiring} à renouveler`);
    return parts.length ? parts.join(", ") : `${c.total} à jour`;
  };

  return (
    <div>
      <PageHeader
        title="Personnel et habilitations"
        description="Salariés, conducteurs, caristes et personnel : suivi des formations, habilitations, visites médicales, EPI et absences."
        action={
          <>
            <Link href="/dashboard/employees/echeances">
              <Button variant="outline">Échéances du personnel</Button>
            </Link>
            <AddPanel title="Nouveau salarié">
              <EmployeeForm profiles={profiles} sites={sites} />
            </AddPanel>
          </>
        }
      />

      <ListToolbar basePath="/dashboard/employees" search={sp.q} includeArchived={includeArchived}>
        <Select name="status" defaultValue={sp.status ?? ""} className="w-40">
          <option value="">Tous les statuts</option>
          {WORK_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{WORK_STATUS_LABELS[s] ?? s}</option>
          ))}
        </Select>
        <Select name="contract" defaultValue={sp.contract ?? ""} className="w-36">
          <option value="">Tous contrats</option>
          {EMPLOYEE_CONTRACT_TYPES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        {sites.length > 0 ? (
          <Select name="site" defaultValue={sp.site ?? ""} className="w-44">
            <option value="">Tous les sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        ) : null}
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(e) => e.id}
        href={(e) => `/dashboard/employees/${e.id}`}
        empty="Aucun salarié."
        columns={[
          { header: "Nom", cell: (e) => (
            <span className="flex items-center gap-2">
              <Avatar src={e.avatar_url} name={[e.first_name, e.last_name].filter(Boolean).join(" ")} size={28} />
              <span className="font-medium">{[e.last_name, e.first_name].filter(Boolean).join(" ")}</span>
            </span>
          ) },
          { header: "Métier", cell: (e) => e.job_family ?? e.job_title ?? "—" },
          { header: "Site", cell: (e) => siteName(e.site_id) },
          { header: "Statut", cell: (e) => WORK_STATUS_LABELS[e.status] ?? e.status },
          { header: "Conformité", cell: (e) => compBadge(e.id) },
          { header: "Prochaine échéance", cell: (e) => formatDate(nextDue(e.id)) },
          { header: "Habilitations", cell: (e) => certLabel(e.id) },
          { header: "Responsable", cell: (e) => profName(e.responsible_id) },
        ]}
        card={(e) => ({
          title: [e.last_name, e.first_name].filter(Boolean).join(" "),
          badge: compBadge(e.id),
          fields: [
            { label: "Métier", value: e.job_family ?? e.job_title ?? "—" },
            { label: "Site", value: siteName(e.site_id) },
            { label: "Prochaine échéance", value: formatDate(nextDue(e.id)) },
            { label: "Habilitations", value: certLabel(e.id) },
          ],
        })}
        actions={(e) => <ArchiveButton table="employees" id={e.id} archived={e.is_archived} />}
      />

      <Pagination
        basePath="/dashboard/employees"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, archived: sp.archived, status: sp.status, site: sp.site, contract: sp.contract }}
      />
    </div>
  );
}

function EmployeeForm({ profiles, sites }: { profiles: Profile[]; sites: { id: string; name: string }[] }) {
  const profOptions = profiles.map((p) => (
    <option key={p.id} value={p.id}>
      {[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}
    </option>
  ));
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
        <Label>Métier / fonction</Label>
        <Select name="job_family" defaultValue="">
          <option value="">Non renseigné</option>
          {JOB_FAMILIES.map((j) => <option key={j} value={j}>{j}</option>)}
        </Select>
      </div>
      <div>
        <Label>Service</Label>
        <Input name="service" />
      </div>
      <div>
        <Label>Site / agence</Label>
        <Select name="site_id" defaultValue="">
          <option value="">Non assigné</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Type de contrat</Label>
        <Select name="contract_type" defaultValue="">
          <option value="">Non renseigné</option>
          {EMPLOYEE_CONTRACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>
      <div>
        <Label>Date d&apos;entrée</Label>
        <Input name="hire_date" type="date" />
      </div>
      <div>
        <Label>Statut</Label>
        <Select name="status" defaultValue="actif">
          {WORK_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{WORK_STATUS_LABELS[s] ?? s}</option>)}
        </Select>
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
        <Label>Responsable</Label>
        <Select name="responsible_id" defaultValue="">
          <option value="">Non assigné</option>
          {profOptions}
        </Select>
      </div>
      <div>
        <Label>Superviseur</Label>
        <Select name="supervisor_id" defaultValue="">
          <option value="">Non assigné</option>
          {profOptions}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer le salarié</Button>
      </div>
    </form>
  );
}
