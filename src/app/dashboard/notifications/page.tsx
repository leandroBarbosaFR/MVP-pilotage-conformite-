import Link from "next/link";
import { WarningIcon as AlertTriangle } from "@phosphor-icons/react/dist/ssr";
import { requireContext } from "@/lib/queries/auth";
import {
  getUpcomingObligations,
  getOverdueActions,
  getExpiredObligations,
  getExpiredDocuments,
} from "@/lib/queries/dashboard";
import { getNotifications } from "@/lib/queries/entities";
import { markAllNotificationsRead } from "@/lib/actions/entities";
import { canManageUsers } from "@/lib/permissions";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { UpdateAlertsButton } from "@/components/app/update-alerts-button";
import { NotificationList } from "@/components/notifications/notification-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus } from "@/lib/types/database";

export default async function AlertsPage() {
  const { company, profile } = await requireContext();
  const [upcoming, overdue, expiredObl, expired, stored] = await Promise.all([
    getUpcomingObligations(company.id),
    getOverdueActions(company.id),
    getExpiredObligations(company.id),
    getExpiredDocuments(company.id),
    getNotifications(profile.id),
  ]);
  const canGenerate = canManageUsers(profile.role) || profile.role === "QHSE_MANAGER";

  // Alertes « vivantes » : dérivées directement des données (même source que le tableau de bord).
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertes"
        description="Échéances dépassées ou à venir, actions en retard et documents expirés — tous modules confondus."
        action={canGenerate ? <UpdateAlertsButton /> : undefined}
      />

      <Card>
        <CardHeader>
          <CardTitle>Alertes en cours ({alerts.length})</CardTitle>
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
            <p className="px-4 py-8 text-sm text-muted-foreground">Aucune alerte en cours. Tout est à jour.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Notifications envoyées</CardTitle>
          {stored.length > 0 ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="outline" size="sm">Tout marquer comme lu</Button>
            </form>
          ) : null}
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">
            Notifications internes adressées aux responsables et superviseurs. Utilisez « Mettre à jour les alertes »
            pour les générer à partir des échéances ci-dessus.
          </p>
          <NotificationList items={stored} />
        </CardContent>
      </Card>
    </div>
  );
}
