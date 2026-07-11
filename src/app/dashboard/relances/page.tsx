import Link from "next/link";
import { requireContext } from "@/lib/queries/auth";
import { getReminders, getEntityNameMap, getProfiles } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ListView } from "@/components/app/list-view";
import { Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReminderStatusSelect } from "@/components/app/reminder-status-select";
import { REMINDER_STATUS_LABELS, REMINDER_STATUS_TONE, REMINDER_CHANNEL_LABELS } from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/types/database";

const PAGE_SIZE = 20;

const ENTITY_ROUTE: Record<string, string> = {
  PROVIDER: "providers", SITE: "sites", VEHICLE: "vehicles", EMPLOYEE: "employees",
  DRIVER: "employees", EQUIPMENT: "equipments", CONTRACT: "contracts",
  INCIDENT: "incidents", ACTION: "actions", PPE: "epi",
};

export default async function RelancesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));

  const [{ rows, count }, names, profiles] = await Promise.all([
    getReminders(company.id, { search: sp.q, status: sp.status, page, pageSize: PAGE_SIZE }),
    getEntityNameMap(company.id),
    getProfiles(company.id),
  ]);

  const profName = (id: string | null) => {
    if (!id) return null;
    const p = profiles.find((x) => x.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email : null;
  };
  const entityHref = (rt: string | null, rid: string | null) =>
    rt && rid && ENTITY_ROUTE[rt] ? `/dashboard/${ENTITY_ROUTE[rt]}/${rid}` : null;

  return (
    <div>
      <PageHeader
        title="Relances"
        description="Historique et suivi des relances (documents, prestataires, contrats, contrôles, actions, personnel)."
      />

      <ListToolbar basePath="/dashboard/relances" search={sp.q}>
        <div className="w-40">
          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">Toutes</option>
            {Object.entries(REMINDER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(r) => r.id}
        empty="Aucune relance enregistrée."
        columns={[
          { header: "Élément concerné", cell: (r) => <span className="font-medium">{r.title}</span> },
          { header: "Élément lié", cell: (r) => (r.related_entity_id ? names.get(r.related_entity_id) ?? "—" : "—") },
          { header: "Personne", cell: (r) => r.person_to_remind ?? profName(r.person_id) ?? "—" },
          { header: "Canal", cell: (r) => REMINDER_CHANNEL_LABELS[r.channel] ?? r.channel },
          { header: "Dernière relance", cell: (r) => formatDate(r.reminded_at) },
          { header: "Prochaine", cell: (r) => formatDate(r.next_reminder_at) },
          { header: "Statut", cell: (r) => <StatusBadge status={(REMINDER_STATUS_TONE[r.status] ?? "none") as ComplianceStatus} label={REMINDER_STATUS_LABELS[r.status] ?? r.status} /> },
        ]}
        card={(r) => ({
          title: r.title,
          badge: <StatusBadge status={(REMINDER_STATUS_TONE[r.status] ?? "none") as ComplianceStatus} label={REMINDER_STATUS_LABELS[r.status] ?? r.status} />,
          fields: [
            { label: "Personne", value: r.person_to_remind ?? profName(r.person_id) ?? "—" },
            { label: "Canal", value: REMINDER_CHANNEL_LABELS[r.channel] ?? r.channel },
            { label: "Dernière relance", value: formatDate(r.reminded_at) },
          ],
        })}
        actions={(r) => {
          const href = entityHref(r.related_entity_type, r.related_entity_id);
          return (
            <>
              {href ? (
                <Link href={href} className="text-xs font-medium text-accent hover:underline">Voir l&apos;élément</Link>
              ) : null}
              <ReminderStatusSelect id={r.id} status={r.status} />
            </>
          );
        }}
      />

      <Pagination basePath="/dashboard/relances" page={page} count={count} pageSize={PAGE_SIZE} params={{ q: sp.q, status: sp.status }} />
    </div>
  );
}
