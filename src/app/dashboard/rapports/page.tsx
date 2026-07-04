import { requireContext } from "@/lib/queries/auth";
import {
  getDashboardStats,
  getUpcomingObligations,
  getOverdueActions,
  getExpiredDocuments,
} from "@/lib/queries/dashboard";
import type { Obligation, ActionRow, DocumentRow } from "@/lib/types/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ListView } from "@/components/app/list-view";
import { ExportButtons } from "@/components/reports/export-buttons";
import { formatDate } from "@/lib/utils";

export default async function RapportsPage() {
  const { company } = await requireContext();
  const [dashboard, upcoming, overdue, expired] = await Promise.all([
    getDashboardStats(company.id),
    getUpcomingObligations(company.id),
    getOverdueActions(company.id),
    getExpiredDocuments(company.id),
  ]);

  const { stats } = dashboard;
  const total = stats.obligations_total;
  const conformRate = total > 0 ? Math.round((stats.obligations_ok / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Rapports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Synthèse de conformité — exports pour la direction et les audits.
          </p>
        </div>
        <ExportButtons />
      </div>

      {/* Section 1 — Rapport global */}
      <Card>
        <CardHeader>
          <CardTitle>Rapport global de conformité</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <Kpi label="Taux conforme" value={`${conformRate}%`} tone="ok" />
              <Kpi label="Total obligations" value={total} />
              <Kpi label="À surveiller" value={stats.obligations_soon} tone="warn" />
              <Kpi label="Critique" value={stats.obligations_expired} tone="danger" />
              <Kpi label="Actions en retard" value={dashboard.overdue_actions} tone="danger" />
              <Kpi label="Documents expirés" value={dashboard.expired_documents} tone="danger" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2 — Échéances à venir */}
      <Card>
        <CardHeader>
          <CardTitle>Échéances à venir</CardTitle>
        </CardHeader>
        <CardContent>
          <ListView<Obligation>
            rows={upcoming}
            getKey={(o) => o.id}
            empty="Aucune échéance à venir."
            columns={[
              { header: "Titre", cell: (o) => <span className="font-medium">{o.title}</span> },
              { header: "Échéance", cell: (o) => formatDate(o.due_date) },
            ]}
            card={(o) => ({
              title: o.title,
              fields: [{ label: "Échéance", value: formatDate(o.due_date) }],
            })}
          />
        </CardContent>
      </Card>

      {/* Section 3 — Actions en retard */}
      <Card>
        <CardHeader>
          <CardTitle>Actions en retard</CardTitle>
        </CardHeader>
        <CardContent>
          <ListView<ActionRow>
            rows={overdue}
            getKey={(a) => a.id}
            empty="Aucune action en retard."
            columns={[
              { header: "Titre", cell: (a) => <span className="font-medium">{a.title}</span> },
              { header: "Échéance", cell: (a) => formatDate(a.due_date) },
            ]}
            card={(a) => ({
              title: a.title,
              fields: [{ label: "Échéance", value: formatDate(a.due_date) }],
            })}
          />
        </CardContent>
      </Card>

      {/* Section 4 — Documents expirés */}
      <Card>
        <CardHeader>
          <CardTitle>Documents expirés</CardTitle>
        </CardHeader>
        <CardContent>
          <ListView<DocumentRow>
            rows={expired}
            getKey={(d) => d.id}
            empty="Aucun document expiré."
            columns={[
              { header: "Titre", cell: (d) => <span className="font-medium">{d.title}</span> },
              { header: "Expiration", cell: (d) => formatDate(d.expiration_date) },
            ]}
            card={(d) => ({
              title: d.title,
              fields: [{ label: "Expiration", value: formatDate(d.expiration_date) }],
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "ok" | "warn" | "danger";
}) {
  const toneClass =
    tone === "ok"
      ? "text-status-ok"
      : tone === "warn"
        ? "text-status-warn"
        : tone === "danger"
          ? "text-status-danger"
          : "text-foreground";
  return (
    <div>
      <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
