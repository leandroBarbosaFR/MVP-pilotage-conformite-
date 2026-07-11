import { requireContext } from "@/lib/queries/auth";
import { getActivityLog, getProfiles } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { ACTIVITY_ACTION_LABELS, ACTIVITY_ENTITY_LABELS } from "@/types/enums";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 30;

export default async function HistoriquePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));

  const [{ rows, count }, profiles] = await Promise.all([
    getActivityLog(company.id, { page, pageSize: PAGE_SIZE }),
    getProfiles(company.id),
  ]);

  const byId = new Map<string, string>();
  const byUserId = new Map<string, string>();
  for (const p of profiles) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—";
    byId.set(p.id, name);
    if (p.user_id) byUserId.set(p.user_id, name);
  }
  const userName = (uid: string | null) => (uid ? byId.get(uid) ?? byUserId.get(uid) ?? "—" : "Système");

  return (
    <div>
      <PageHeader
        title="Historique"
        description="Journal des actions réalisées dans l'application (archivage, relances, actions correctives, modifications…)."
      />

      <Table>
        <THead>
          <TR>
            <TH>Date</TH>
            <TH>Utilisateur</TH>
            <TH>Module</TH>
            <TH>Type d&apos;action</TH>
            <TH>Élément</TH>
            <TH>Commentaire</TH>
          </TR>
        </THead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} message="Aucun événement enregistré." />
          ) : (
            rows.map((r) => {
              const nv = (r.new_value ?? {}) as { label?: string | null; comment?: string | null };
              return (
                <TR key={r.id}>
                  <TD className="whitespace-nowrap">{formatDateTime(r.created_at)}</TD>
                  <TD>{userName(r.user_id)}</TD>
                  <TD>{ACTIVITY_ENTITY_LABELS[r.entity_type] ?? r.entity_type}</TD>
                  <TD>{ACTIVITY_ACTION_LABELS[r.action_type] ?? r.action_type}</TD>
                  <TD>{nv.label ?? "—"}</TD>
                  <TD>{nv.comment ?? "—"}</TD>
                </TR>
              );
            })
          )}
        </tbody>
      </Table>

      <Pagination basePath="/dashboard/historique" page={page} count={count} pageSize={PAGE_SIZE} params={{}} />
    </div>
  );
}
