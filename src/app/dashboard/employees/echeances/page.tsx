import Link from "next/link";
import { requireContext } from "@/lib/queries/auth";
import { getPersonnelDeadlines, getProfiles } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { OBLIGATION_STATUS_LABELS, complianceFromObligationStatus } from "@/lib/status";
import { CERTIFICATION_TYPE_LABELS, CertificationType } from "@/types/enums";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function PersonnelDeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; type?: string; status?: string; archived?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles] = await Promise.all([
    getPersonnelDeadlines(company.id, {
      search: sp.q,
      category: sp.type,
      status: sp.status,
      includeArchived,
      page,
      pageSize: PAGE_SIZE,
    }),
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
        title="Échéances du personnel"
        description="Toutes les formations, habilitations, visites médicales, permis et EPI arrivant à échéance, tous salariés confondus."
        action={
          <Link href="/dashboard/employees">
            <Button variant="outline">Retour au personnel</Button>
          </Link>
        }
      />

      <ListToolbar basePath="/dashboard/employees/echeances" search={sp.q} includeArchived={includeArchived}>
        <Select name="type" defaultValue={sp.type ?? ""} className="w-48">
          <option value="">Tous les types</option>
          {Object.values(CertificationType).map((t) => (
            <option key={t} value={t}>{CERTIFICATION_TYPE_LABELS[t]}</option>
          ))}
        </Select>
        <Select name="status" defaultValue={sp.status ?? ""} className="w-44">
          <option value="">Tous les statuts</option>
          {Object.entries(OBLIGATION_STATUS_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </Select>
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(r) => r.cert.id}
        href={(r) => `/dashboard/employees/${r.cert.employee_id}`}
        empty="Aucune échéance de personnel."
        columns={[
          { header: "Salarié", cell: (r) => <span className="font-medium">{r.employeeName}</span> },
          { header: "Poste", cell: (r) => r.jobTitle ?? "—" },
          { header: "Site", cell: (r) => r.siteName ?? "—" },
          { header: "Type", cell: (r) => CERTIFICATION_TYPE_LABELS[r.cert.type] ?? r.cert.type },
          { header: "Intitulé", cell: (r) => r.cert.category ?? r.cert.title },
          { header: "Obtention", cell: (r) => formatDate(r.cert.obtained_date) },
          { header: "Expiration", cell: (r) => formatDate(r.cert.expiry_date) },
          {
            header: "Statut",
            cell: (r) => (
              <StatusBadge
                status={complianceFromObligationStatus(r.cert.status)}
                label={OBLIGATION_STATUS_LABELS[r.cert.status]}
              />
            ),
          },
          { header: "Responsable", cell: (r) => profName(r.cert.responsible_id) },
        ]}
        card={(r) => ({
          title: r.employeeName,
          badge: (
            <StatusBadge
              status={complianceFromObligationStatus(r.cert.status)}
              label={OBLIGATION_STATUS_LABELS[r.cert.status]}
            />
          ),
          fields: [
            { label: "Type", value: CERTIFICATION_TYPE_LABELS[r.cert.type] ?? r.cert.type },
            { label: "Intitulé", value: r.cert.category ?? r.cert.title },
            { label: "Expiration", value: formatDate(r.cert.expiry_date) },
            { label: "Site", value: r.siteName ?? "—" },
          ],
        })}
      />

      <Pagination
        basePath="/dashboard/employees/echeances"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, type: sp.type, status: sp.status, archived: sp.archived }}
      />
    </div>
  );
}
