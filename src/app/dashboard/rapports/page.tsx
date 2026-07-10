import { requireContext } from "@/lib/queries/auth";
import {
  getDashboardStats,
  getUpcomingObligations,
  getOverdueActions,
  getExpiredDocuments,
  getModulePriorities,
  getOpenIncidents,
} from "@/lib/queries/dashboard";
import type { ComplianceStatus, Obligation, ActionRow, DocumentRow } from "@/lib/types/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExportButtons, type ReportData } from "@/components/reports/export-buttons";
import { INCIDENT_STATUS_LABELS, type IncidentStatus } from "@/types/enums";
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

  const [priorities, openIncidents] = await Promise.all([
    getModulePriorities(company.id, { missingDocs: stats.missing_documents, overdueActions: dashboard.overdue_actions }),
    getOpenIncidents(company.id),
  ]);

  const priorityRow = (p: (typeof priorities)[number]) => {
    const tone: ComplianceStatus = p.overdue > 0 ? "danger" : p.count > 0 ? "warn" : "ok";
    const label = tone === "danger" ? "Éléments critiques" : tone === "warn" ? "À surveiller" : "À jour";
    return { tone, label };
  };

  const reportData: ReportData = {
    summary: [
      { label: "Taux de suivi à jour", value: `${conformRate}%` },
      { label: "Total obligations", value: total },
      { label: "À surveiller", value: stats.obligations_soon },
      { label: "Éléments critiques", value: stats.obligations_expired },
      { label: "Actions en retard", value: dashboard.overdue_actions },
      { label: "Documents expirés", value: dashboard.expired_documents },
      { label: "Incidents non clôturés", value: openIncidents.length },
    ],
    priorities: priorities.map((p) => ({ label: p.label, count: p.count, status: priorityRow(p).label })),
    upcoming: upcoming.map((o) => ({ title: o.title, due: formatDate(o.due_date) })),
    overdue: overdue.map((a) => ({ title: a.title, due: formatDate(a.due_date) })),
    expired: expired.map((d) => ({ title: d.title, expiration: formatDate(d.expiration_date) })),
    incidents: openIncidents.map((n) => ({ title: n.title, date: formatDate(n.occurred_at), status: INCIDENT_STATUS_LABELS[n.status as IncidentStatus] ?? n.status })),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Rapports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Synthèse de conformité — exports pour la direction et les audits.
          </p>
        </div>
        <ExportButtons data={reportData} />
      </div>

      {/* Section 1 — Rapport global */}
      <Card>
        <CardHeader>
          <CardTitle>Rapport global de suivi</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <Kpi label="Suivi à jour" value={`${conformRate}%`} tone="ok" />
              <Kpi label="Total obligations" value={total} />
              <Kpi label="À surveiller" value={stats.obligations_soon} tone="warn" />
              <Kpi label="Éléments critiques" value={stats.obligations_expired} tone="danger" />
              <Kpi label="Actions en retard" value={dashboard.overdue_actions} tone="danger" />
              <Kpi label="Documents expirés" value={dashboard.expired_documents} tone="danger" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 1bis — Priorités par module */}
      <Card>
        <CardHeader>
          <CardTitle>Priorités par module</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {priorities.map((p) => {
            const r = priorityRow(p);
            return (
              <div key={p.label} className="flex items-center justify-between gap-3 bg-surface px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold tabular-nums text-foreground">{p.count}</span>
                    <span className="truncate text-sm text-foreground">{p.label}</span>
                  </div>
                  <StatusBadge status={r.tone} label={r.label} className="mt-1" />
                </div>
              </div>
            );
          })}
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

      {/* Section 5 — Incidents non clôturés */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents non clôturés</CardTitle>
        </CardHeader>
        <CardContent>
          <ListView
            rows={openIncidents}
            getKey={(n) => n.id}
            empty="Aucun incident ouvert."
            columns={[
              { header: "Titre", cell: (n) => <span className="font-medium">{n.title}</span> },
              { header: "Date", cell: (n) => formatDate(n.occurred_at) },
              { header: "Statut", cell: (n) => INCIDENT_STATUS_LABELS[n.status as IncidentStatus] ?? n.status },
            ]}
            card={(n) => ({
              title: n.title,
              fields: [{ label: "Date", value: formatDate(n.occurred_at) }],
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
