import { requireContext } from "@/lib/queries/auth";
import { getProviders, getProfiles, getSiteOptions } from "@/lib/queries/entities";
import { createProvider } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { AiActionLink } from "@/components/ai/ai-action-link";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { ReminderDialog } from "@/components/app/reminder-dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { PROVIDER_TYPES, PRIORITY_LABELS, PriorityLevel } from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus, Profile, Provider } from "@/lib/types/database";

const PAGE_SIZE = 20;

function providerStatus(p: Provider): { tone: ComplianceStatus; label: string } {
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  if (p.insurance_expiry && p.insurance_expiry < today) return { tone: "danger", label: "Assurance expirée" };
  if (p.needs_followup) return { tone: "warn", label: "À relancer" };
  if (p.insurance_expiry && p.insurance_expiry <= in30) return { tone: "warn", label: "Assurance à renouveler" };
  return { tone: "ok", label: "À jour" };
}

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string; page?: string; site?: string; followup?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles, sites] = await Promise.all([
    getProviders(company.id, {
      search: sp.q,
      site: sp.site,
      followup: sp.followup === "1",
      includeArchived,
      page,
      pageSize: PAGE_SIZE,
    }),
    getProfiles(company.id),
    getSiteOptions(company.id),
  ]);

  const statusBadge = (p: Provider) => {
    const st = providerStatus(p);
    return <StatusBadge status={st.tone} label={st.label} />;
  };

  return (
    <div>
      <PageHeader
        title="Prestataires"
        description="Entreprises externes : contrôle, maintenance, assurance, médecine du travail, formation — documents, contrats et relances."
        action={
          <>
            <AiActionLink action="provider-reminder" label="Relance IA" />
            <AddPanel title="Nouveau prestataire">
              <ProviderForm profiles={profiles} sites={sites} />
            </AddPanel>
          </>
        }
      />

      <ListToolbar basePath="/dashboard/providers" search={sp.q} includeArchived={includeArchived}>
        {sites.length > 0 ? (
          <Select name="site" defaultValue={sp.site ?? ""} className="w-44">
            <option value="">Tous les sites</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        ) : null}
        <Select name="followup" defaultValue={sp.followup ?? ""} className="w-40">
          <option value="">Tous</option>
          <option value="1">À relancer</option>
        </Select>
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(p) => p.id}
        href={(p) => `/dashboard/providers/${p.id}`}
        empty="Aucun prestataire."
        columns={[
          { header: "Nom", cell: (p) => <span className="font-medium">{p.name}</span> },
          { header: "Type", cell: (p) => p.provider_type ?? "—" },
          { header: "Contact", cell: (p) => p.contact_name ?? "—" },
          { header: "Téléphone", cell: (p) => p.phone ?? "—" },
          { header: "Assurance", cell: (p) => formatDate(p.insurance_expiry) },
          { header: "Statut", cell: (p) => statusBadge(p) },
        ]}
        card={(p) => ({
          title: p.name,
          badge: statusBadge(p),
          fields: [
            { label: "Type", value: p.provider_type ?? "—" },
            { label: "Contact", value: p.contact_name ?? "—" },
            { label: "Assurance", value: formatDate(p.insurance_expiry) },
          ],
        })}
        actions={(p) => (
          <>
            <ReminderDialog
              label={p.name}
              module="Prestataires"
              relatedType="PROVIDER"
              relatedId={p.id}
              providerId={p.id}
              people={profiles.map((x) => ({ id: x.id, name: [x.first_name, x.last_name].filter(Boolean).join(" ") || x.email || "—" }))}
              defaultPersonName={p.contact_name}
            />
            <ArchiveButton table="providers" id={p.id} archived={p.is_archived} />
          </>
        )}
      />

      <Pagination
        basePath="/dashboard/providers"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, archived: sp.archived, site: sp.site, followup: sp.followup }}
      />
    </div>
  );
}

function ProviderForm({ profiles, sites }: { profiles: Profile[]; sites: { id: string; name: string }[] }) {
  return (
    <form action={createProvider} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Nom</Label>
        <Input name="name" required />
      </div>
      <div>
        <Label>Type de prestataire</Label>
        <Select name="provider_type" defaultValue={PROVIDER_TYPES[0]}>
          {PROVIDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>
      <div>
        <Label>Site concerné</Label>
        <Select name="site_id" defaultValue="">
          <option value="">Aucun</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Contact</Label>
        <Input name="contact_name" />
      </div>
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" />
      </div>
      <div>
        <Label>Téléphone</Label>
        <Input name="phone" />
      </div>
      <div className="sm:col-span-2">
        <Label>Adresse</Label>
        <Input name="address" />
      </div>
      <div className="sm:col-span-2">
        <Label>Complément d&apos;adresse</Label>
        <Input name="address_complement" />
      </div>
      <div>
        <Label>Code postal</Label>
        <Input name="postal_code" />
      </div>
      <div>
        <Label>Ville</Label>
        <Input name="city" />
      </div>
      <div>
        <Label>Pays</Label>
        <Input name="country" defaultValue="France" />
      </div>
      <div>
        <Label>Assurance (expiration)</Label>
        <Input name="insurance_expiry" type="date" />
      </div>
      <div>
        <Label>Priorité</Label>
        <Select name="priority" defaultValue={PriorityLevel.MEDIUM}>
          {Object.values(PriorityLevel).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </Select>
      </div>
      <div>
        <Label>Responsable interne</Label>
        <Select name="responsible_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>)}
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <input id="needs_followup" name="needs_followup" type="checkbox" className="h-4 w-4 accent-accent" />
        <Label className="mb-0" htmlFor="needs_followup">Relance à faire</Label>
      </div>
      <div className="sm:col-span-2">
        <Label>Notes</Label>
        <Textarea name="notes" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer le prestataire</Button>
      </div>
    </form>
  );
}
