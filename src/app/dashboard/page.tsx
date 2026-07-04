import Link from "next/link";
import {
  CheckCircleIcon as CheckCircle2,
  WarningIcon as AlertTriangle,
  WarningOctagonIcon as AlertOctagon,
  ClipboardTextIcon as ClipboardList,
  ClockIcon as Clock,
  FileDashedIcon as FileWarning,
  CalendarBlankIcon as Calendar,
  DownloadSimpleIcon as Download,
} from "@phosphor-icons/react/dist/ssr";
import { requireContext } from "@/lib/queries/auth";
import {
  getDashboardStats,
  getUpcomingObligations,
  getOverdueActions,
  getExpiredDocuments,
  getPendingActions,
} from "@/lib/queries/dashboard";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ACTION_STATUS_LABELS,
  PRIORITY_LABELS,
  complianceFromActionStatus,
} from "@/lib/status";
import { formatDate, daysUntil } from "@/lib/utils";
import type { ComplianceStatus, PriorityLevel } from "@/lib/types/database";

const PRIORITY_TONE: Record<PriorityLevel, ComplianceStatus> = {
  critique: "danger",
  moyen: "warn",
  faible: "none",
};

export default async function DashboardPage() {
  const { company } = await requireContext();

  const [stats, upcoming, overdue, expired, pending] = await Promise.all([
    getDashboardStats(company.id),
    getUpcomingObligations(company.id),
    getOverdueActions(company.id),
    getExpiredDocuments(company.id),
    getPendingActions(company.id),
  ]);

  const { stats: s } = stats;
  const okCount = s.obligations_ok || 0;
  const warnCount = s.obligations_soon || 0;
  const dangerCount = s.obligations_expired || 0;
  const total = s.obligations_total || 0;
  const score = total > 0 ? Math.round((okCount / total) * 100) : 100;

  // Alertes prioritaires : actions en retard + documents expirés + échéances proches
  const alerts = [
    ...overdue.map((a) => ({
      key: `a-${a.id}`,
      href: `/dashboard/actions/${a.id}`,
      title: a.title,
      sub: `Action en retard — échéance ${formatDate(a.due_date)}`,
      tone: "danger" as ComplianceStatus,
      badge: "Critique",
    })),
    ...expired.map((d) => ({
      key: `d-${d.id}`,
      href: `/dashboard/documents/${d.id}`,
      title: d.title,
      sub: `Document expiré le ${formatDate(d.expiration_date)}`,
      tone: "danger" as ComplianceStatus,
      badge: "Critique",
    })),
    ...upcoming.map((o) => ({
      key: `o-${o.id}`,
      href: `/dashboard/obligations/${o.id}`,
      title: o.title,
      sub: `Échéance le ${formatDate(o.due_date)}`,
      tone: "warn" as ComplianceStatus,
      badge: "À surveiller",
    })),
  ].slice(0, 7);

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vue globale de votre conformité</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            {today}
          </span>
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Download size={16} />
            Exporter le rapport
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Conforme" value={`${score} %`} tone="ok" icon={CheckCircle2} />
        <StatCard label="À surveiller" value={warnCount} tone="warn" icon={AlertTriangle} hint="Éléments" />
        <StatCard label="Critique" value={dangerCount} tone="danger" icon={AlertOctagon} hint="Éléments" />
        <StatCard label="Total obligations" value={total} tone="none" icon={ClipboardList} hint="Tous types" />
        <StatCard label="Actions en retard" value={stats.overdue_actions} tone="danger" icon={Clock} />
        <StatCard label="Documents manquants" value={s.missing_documents} tone="warn" icon={FileWarning} />
      </div>

      {/* Alertes + Score */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Alertes prioritaires</CardTitle>
            <Link href="/dashboard/notifications" className="text-xs font-medium text-accent hover:underline">
              Voir toutes
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {alerts.length > 0 ? (
              <ul className="divide-y divide-border">
                {alerts.map((al) => (
                  <li key={al.key}>
                    <Link href={al.href} className="flex items-center gap-3 px-4 py-3 hover:bg-muted">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                          al.tone === "danger" ? "bg-status-danger/10 text-status-danger" : "bg-status-warn/10 text-status-warn"
                        }`}
                      >
                        <AlertTriangle size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">{al.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{al.sub}</div>
                      </div>
                      <StatusBadge status={al.tone} label={al.badge} className="shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-8 text-sm text-muted-foreground">Aucune alerte prioritaire. Tout est à jour.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score de conformité</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 py-6">
            <ScoreDonut score={score} ok={okCount} warn={warnCount} danger={dangerCount} />
            <div className="grid w-full grid-cols-3 gap-2 text-center">
              <Legend label="Conforme" tone="ok" count={okCount} total={total} />
              <Legend label="À surveiller" tone="warn" count={warnCount} total={total} />
              <Legend label="Critique" tone="danger" count={dangerCount} total={total} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions à réaliser */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Actions à réaliser</CardTitle>
          <Link href="/dashboard/actions" className="text-xs font-medium text-accent hover:underline">
            Voir toutes
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {pending.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Échéance</th>
                    <th className="px-4 py-3 font-medium">Priorité</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pending.map((a) => {
                    const d = daysUntil(a.due_date);
                    const late = d !== null && d < 0;
                    return (
                      <tr key={a.id} className="hover:bg-muted">
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/actions/${a.id}`} className="font-medium text-foreground hover:underline">
                            {a.title}
                          </Link>
                        </td>
                        <td className={`px-4 py-3 ${late ? "font-medium text-status-danger" : "text-muted-foreground"}`}>
                          {late && d !== null ? `En retard (${Math.abs(d)} j)` : formatDate(a.due_date)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={PRIORITY_TONE[a.priority]} label={PRIORITY_LABELS[a.priority]} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={complianceFromActionStatus(a.status)}
                            label={ACTION_STATUS_LABELS[a.status]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-8 text-sm text-muted-foreground">Aucune action en attente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Legend({
  label,
  tone,
  count,
  total,
}: {
  label: string;
  tone: ComplianceStatus;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const dot = tone === "ok" ? "bg-status-ok" : tone === "warn" ? "bg-status-warn" : "bg-status-danger";
  return (
    <div>
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{pct} %</div>
    </div>
  );
}

function ScoreDonut({
  score,
  ok,
  warn,
  danger,
}: {
  score: number;
  ok: number;
  warn: number;
  danger: number;
}) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const sum = ok + warn + danger;
  const segments =
    sum > 0
      ? [
          { color: "hsl(var(--status-ok))", frac: ok / sum },
          { color: "hsl(var(--status-warn))", frac: warn / sum },
          { color: "hsl(var(--status-danger))", frac: danger / sum },
        ].filter((seg) => seg.frac > 0)
      : [];

  let cumulative = 0;

  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="18" />
        {segments.map((seg, i) => {
          const dash = seg.frac * C;
          const el = (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${C}`}
              strokeDashoffset={-cumulative * C}
            />
          );
          cumulative += seg.frac;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums text-foreground">
          {score}
          <span className="text-lg">%</span>
        </span>
        <span className="text-xs text-muted-foreground">Conformité globale</span>
      </div>
    </div>
  );
}
