import { requireContext } from "@/lib/queries/auth";
import { getProfiles } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { DemoButton } from "@/components/settings/demo-button";
import type { UserRole } from "@/lib/types/database";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN_COMPANY: "Administrateur",
  SUPERVISOR: "Superviseur",
  RESPONSIBLE: "Responsable",
  VIEWER: "Lecteur",
};

function fullName(first: string | null, last: string | null, fallback: string | null): string {
  const name = [first, last].filter(Boolean).join(" ");
  return name || fallback || "—";
}

export default async function SettingsPage() {
  const { company, profile } = await requireContext();
  const members = await getProfiles(company.id);

  return (
    <div>
      <PageHeader title="Paramètres" description="Informations de l'entreprise et du compte." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entreprise</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Nom</dt>
                <dd className="text-foreground">{company.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Secteur</dt>
                <dd className="text-foreground">{company.sector ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Effectif</dt>
                <dd className="text-foreground">{company.employee_count ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mon compte</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Nom</dt>
                <dd className="text-foreground">
                  {fullName(profile.first_name, profile.last_name, profile.email)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="text-foreground">{profile.email ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Rôle</dt>
                <dd className="text-foreground">{ROLE_LABELS[profile.role]}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Données de démonstration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Chargez un jeu de données fictives pour explorer l&apos;application.
            </p>
            <DemoButton />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Membres de l&apos;entreprise</h2>
        <Table>
          <THead>
            <TR>
              <TH>Nom</TH>
              <TH>Email</TH>
              <TH>Rôle</TH>
            </TR>
          </THead>
          <tbody>
            {members.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucun membre." />
            ) : (
              members.map((m) => (
                <TR key={m.id}>
                  <TD className="font-medium">
                    {fullName(m.first_name, m.last_name, m.email)}
                  </TD>
                  <TD>{m.email ?? "—"}</TD>
                  <TD>{ROLE_LABELS[m.role]}</TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
