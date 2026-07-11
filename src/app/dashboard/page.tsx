import Link from "next/link";
import {
  CheckCircleIcon as CheckCircle2,
  WarningIcon as AlertTriangle,
  WarningOctagonIcon as AlertOctagon,
  ClipboardTextIcon as ClipboardList,
  ClockIcon as Clock,
  FileDashedIcon as FileWarning,
  DownloadSimpleIcon as Download,
} from "@phosphor-icons/react/dist/ssr";
import { buttonVariants } from "@/components/ui/button";
import { DemoToggle } from "@/components/app/demo-toggle";
import { DEMO_ALLOWED, DEMO_COOKIE, resolveDemoMode } from "@/lib/demo";
import { cookies } from "next/headers";
import { requireContext } from "@/lib/queries/auth";
import {
  getDashboardStats,
  getUpcomingObligations,
  getOverdueActions,
  getExpiredObligations,
  getExpiredDocuments,
  getPendingActions,
  getModulePriorities,
} from "@/lib/queries/dashboard";
import { StatCard } from "@/components/app/stat-card";
import { UpdateAlertsButton } from "@/components/app/update-alerts-button";
import { AiActionLink } from "@/components/ai/ai-action-link";
import { DemoButton } from "@/components/settings/demo-button";
import { getModuleBreakdown, type ModuleStat } from "@/lib/data";
import { canManageUsers } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ACTION_STATUS_LABELS,
  PRIORITY_LABELS,
  complianceFromActionStatus,
} from "@/lib/status";
import { formatDate, daysUntil, cn } from "@/lib/utils";
import type { ComplianceStatus, PriorityLevel } from "@/lib/types/database";

const PRIORITY_TONE: Record<PriorityLevel, ComplianceStatus> = {
  CRITICAL: "danger",
  HIGH: "warn",
  MEDIUM: "warn",
  LOW: "none",
};

export default async function DashboardPage() {
  const { company, profile } = await requireContext();

  const [stats, upcoming, overdue, expiredObl, expired, pending, modules] = await Promise.all([
    getDashboardStats(company.id),
    getUpcomingObligations(company.id),
    getOverdueActions(company.id),
    getExpiredObligations(company.id),
    getExpiredDocuments(company.id),
    getPendingActions(company.id),
    getModuleBreakdown(),
  ]);

  const { stats: s } = stats;
  // Comptes « obligations » — pour le score et la jauge (conformité des obligations)
  const okCount = s.obligations_ok || 0;
  const oblSoon = s.obligations_soon || 0;
  const oblExpired = s.obligations_expired || 0;
  const total = s.obligations_total || 0;
  const score = total > 0 ? Math.round((okCount / total) * 100) : 0;

  // Comptes « éléments » — pour les cartes KPI et les alertes (obligations + actions + documents)
  const criticalElements = oblExpired + stats.overdue_actions + stats.expired_documents;
  const watchElements = oblSoon;

  const hasData = total > 0 || modules.some((m) => m.total > 0);
  const priorities = await getModulePriorities(company.id, {
    missingDocs: s.missing_documents,
    overdueActions: stats.overdue_actions,
  });
  const canGenerate = canManageUsers(profile.role) || profile.role === "QHSE_MANAGER";

  // Alertes prioritaires : mêmes catégories que le compteur « Critique »
  const alerts = [
    ...overdue.map((a) => ({
      key: `a-${a.id}`,
      href: `/dashboard/actions/${a.id}`,
      title: a.title,
      sub: `Action en retard — échéance ${formatDate(a.due_date)}`,
      tone: "danger" as ComplianceStatus,
      badge: "Critique",
    })),
    ...expiredObl.map((o) => ({
      key: `oe-${o.id}`,
      href: `/dashboard/obligations/${o.id}`,
      title: o.title,
      sub: `Obligation expirée le ${formatDate(o.due_date)}`,
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
  ];
  const alertsTop = alerts.slice(0, 7);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Bouton démo/live — dev uniquement (jamais en production).
  const demoActive = DEMO_ALLOWED
    ? resolveDemoMode((await cookies()).get(DEMO_COOKIE)?.value)
    : false;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vue globale de votre suivi</p>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">{today}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-1.5">
          {DEMO_ALLOWED ? <DemoToggle active={demoActive} /> : null}
          {canGenerate ? <UpdateAlertsButton /> : null}
          <AiActionLink action="direction-synthesis" label="Synthèse IA" />
          <Link
            href="/dashboard/rapports"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            <Download size={16} />
            Exporter le rapport
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div data-tour="stats" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Suivi à jour" value={hasData ? `${score} %` : "—"} tone="ok" icon={CheckCircle2} href="/dashboard/obligations" />
        <StatCard label="À surveiller" value={watchElements} tone="warn" icon={AlertTriangle} hint="Éléments" href="/dashboard/obligations?status=EXPIRING_SOON" />
        <StatCard label="Éléments critiques" value={criticalElements} tone="danger" icon={AlertOctagon} hint="Éléments" href="/dashboard/obligations?status=EXPIRED" />
        <StatCard label="Total obligations" value={total} tone="none" icon={ClipboardList} hint="Tous types" href="/dashboard/obligations" />
        <StatCard label="Actions en retard" value={stats.overdue_actions} tone="danger" icon={Clock} href="/dashboard/actions" />
        <StatCard label="Documents manquants" value={s.missing_documents} tone="warn" icon={FileWarning} href="/dashboard/documents?view=missing" />
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <p className="text-sm font-medium text-foreground">Aucune donnée</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Aucune obligation, aucun équipement ni document n&apos;est encore enregistré. Chargez
              un jeu de démonstration ou commencez par ajouter vos données.
            </p>
            <DemoButton />
          </CardContent>
        </Card>
      ) : (
      <>
      {/* Priorités par module — centre de décision */}
      <Card>
        <CardHeader>
          <CardTitle>Priorités par module</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
          {priorities.map((p) => {
            const tone: ComplianceStatus = p.overdue > 0 ? "danger" : p.count > 0 ? "warn" : "ok";
            const label = tone === "danger" ? "Éléments critiques" : tone === "warn" ? "À surveiller" : "À jour";
            return (
              <div key={p.key} className="flex border-[1px] border-border items-center justify-between gap-3 bg-surface px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold tabular-nums text-foreground">{p.count}</span>
                    <span className="truncate text-sm text-foreground">{p.label}</span>
                  </div>
                  <StatusBadge status={tone} label={label} className="mt-1" />
                </div>
                <Link href={p.href} className="shrink-0 text-xs font-medium text-accent hover:underline">
                  Voir
                </Link>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Alertes + Score */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card data-tour="alerts" className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Alertes prioritaires</CardTitle>
            <Link href="/dashboard/notifications" className="text-xs font-medium text-accent hover:underline">
              Voir toutes
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {alertsTop.length > 0 ? (
              <ul className="divide-y divide-border">
                {alertsTop.map((al) => (
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

        <Card data-tour="score">
          <CardHeader>
            <CardTitle>État du suivi</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5 py-6">
            <ScoreDonut score={score} ok={okCount} warn={oblSoon} danger={oblExpired} />
            <div className="grid w-full grid-cols-3 gap-2 text-center">
              <Legend label="À jour" tone="ok" count={okCount} total={total} />
              <Legend label="À surveiller" tone="warn" count={oblSoon} total={total} />
              <Legend label="Critiques" tone="danger" count={oblExpired} total={total} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions à réaliser */}
      <Card data-tour="actions">
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

      {/* Répartition par module */}
      <ModuleBreakdown modules={modules} />
      </>
      )}
    </div>
  );
}

function ModuleBreakdown({ modules }: { modules: ModuleStat[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par module</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">À jour</th>
                <th className="px-4 py-3 text-right font-medium">À surveiller</th>
                <th className="px-4 py-3 text-right font-medium">Critique</th>
                <th className="px-4 py-3 text-right font-medium">Docs manquants</th>
                <th className="px-4 py-3 text-right font-medium">Actions en retard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {modules.map((m) => (
                <tr key={m.module} className="hover:bg-muted">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link href={m.href} className="hover:text-accent hover:underline">{m.module}</Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{m.total}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-status-ok">{m.compliant}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-status-warn">{m.toWatch}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-status-danger">{m.critical}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{m.missingDocs}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{m.lateActions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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
        <span className="text-[10px] text-muted-foreground">Conformité globale</span>
      </div>
    </div>
  );
}
