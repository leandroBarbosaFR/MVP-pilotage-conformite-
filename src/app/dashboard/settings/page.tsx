import { requireContext } from "@/lib/queries/auth";
import { getUsersByTenant, getNotificationSettings } from "@/lib/data";
import { saveNotificationSettings } from "@/lib/actions/admin";
import { canManageUsers } from "@/lib/permissions";
import { USER_ROLE_LABELS } from "@/types/enums";
import type { UserRole } from "@/lib/types/database";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DemoButton } from "@/components/settings/demo-button";
import { UsersRoles, type MemberRow } from "@/components/settings/users-roles";

function fullName(first: string | null, last: string | null, fallback: string | null): string {
  const name = [first, last].filter(Boolean).join(" ");
  return name || fallback || "—";
}

export default async function SettingsPage() {
  const { company, profile } = await requireContext();
  const [members, settings] = await Promise.all([
    getUsersByTenant(),
    getNotificationSettings(),
  ]);

  const isAdmin = canManageUsers(profile.role);
  const canEditNotifs = isAdmin || profile.role === "QHSE_MANAGER";

  const rows: MemberRow[] = members.map((m) => ({
    id: m.id,
    name: fullName(m.first_name, m.last_name, m.email),
    email: m.email ?? "—",
    role: m.role,
    is_active: m.is_active,
    linked: m.user_id != null,
  }));

  const days = settings?.alert_days_before_due ?? 30;
  const notifyResp = settings?.notify_responsible ?? true;
  const notifySup = settings?.notify_supervisor ?? true;
  const notifyAdmin = settings?.notify_admin ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Entreprise, utilisateurs, rôles et notifications." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entreprise</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <Row label="Nom" value={company.name} />
              <Row label="Secteur" value={company.sector ?? "—"} />
              <Row label="Effectif" value={company.employee_count ?? "—"} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mon compte</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <Row label="Nom" value={fullName(profile.first_name, profile.last_name, profile.email)} />
              <Row label="E-mail" value={profile.email ?? "—"} />
              <Row label="Rôle" value={USER_ROLE_LABELS[profile.role as UserRole] ?? profile.role} />
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Utilisateurs et rôles */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Utilisateurs et rôles</CardTitle>
          {!isAdmin ? (
            <span className="text-xs text-muted-foreground">Lecture seule</span>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          <UsersRoles members={rows} editable={isAdmin} />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {canEditNotifs ? (
            <form action={saveNotificationSettings} className="grid max-w-lg grid-cols-1 gap-4">
              <div>
                <Label>Jours d&apos;alerte avant échéance</Label>
                <Input
                  name="alert_days_before_due"
                  type="number"
                  min={1}
                  max={365}
                  defaultValue={days}
                  className="max-w-32"
                />
              </div>
              <Checkbox name="notify_responsible" label="Notifier le responsable" defaultChecked={notifyResp} />
              <Checkbox name="notify_supervisor" label="Notifier le superviseur" defaultChecked={notifySup} />
              <Checkbox name="notify_admin" label="Notifier l'administrateur" defaultChecked={notifyAdmin} />
              <Checkbox
                name="email_enabled"
                label="Notifications par e-mail (bientôt disponible)"
                defaultChecked={false}
                disabled
              />
              <div>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          ) : (
            <dl className="grid max-w-lg grid-cols-1 gap-2 text-sm">
              <Row label="Jours d'alerte avant échéance" value={String(days)} />
              <Row label="Notifier le responsable" value={notifyResp ? "Oui" : "Non"} />
              <Row label="Notifier le superviseur" value={notifySup ? "Oui" : "Non"} />
              <Row label="Notifier l'administrateur" value={notifyAdmin ? "Oui" : "Non"} />
              <Row label="Notifications par e-mail" value="Désactivé (MVP)" />
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Données de démonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Données de démonstration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Chargez un jeu de données fictives (équipe, véhicules, obligations, actions) pour explorer l&apos;application.
          </p>
          <DemoButton />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
  disabled,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="h-4 w-4 rounded-sm border-input accent-accent"
      />
      {label}
    </label>
  );
}
