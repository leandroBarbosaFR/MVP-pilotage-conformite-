import { requireContext } from "@/lib/queries/auth";
import { getProviders } from "@/lib/queries/entities";
import { createProvider } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { PROVIDER_TYPES } from "@/types/enums";

const PAGE_SIZE = 20;

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const { rows, count } = await getProviders(company.id, { search: sp.q, includeArchived, page, pageSize: PAGE_SIZE });

  return (
    <div>
      <PageHeader
        title="Prestataires"
        description="Organismes de contrôle, mainteneurs, assureurs, médecine du travail, formation…"
        action={
          <AddPanel title="Nouveau prestataire">
            <ProviderForm />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/providers" search={sp.q} includeArchived={includeArchived} />

      <ListView
        rows={rows}
        getKey={(p) => p.id}
        empty="Aucun prestataire."
        columns={[
          { header: "Nom", cell: (p) => <span className="font-medium">{p.name}</span> },
          { header: "Type", cell: (p) => p.provider_type ?? "—" },
          { header: "Contact", cell: (p) => p.contact_name ?? "—" },
          { header: "Email", cell: (p) => p.email ?? "—" },
          { header: "Téléphone", cell: (p) => p.phone ?? "—" },
        ]}
        card={(p) => ({
          title: p.name,
          fields: [
            { label: "Type", value: p.provider_type ?? "—" },
            { label: "Contact", value: p.contact_name ?? "—" },
          ],
        })}
        actions={(p) => <ArchiveButton table="providers" id={p.id} archived={p.is_archived} />}
      />

      <Pagination basePath="/dashboard/providers" page={page} count={count} pageSize={PAGE_SIZE} params={{ q: sp.q, archived: sp.archived }} />
    </div>
  );
}

function ProviderForm() {
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
      <div>
        <Label>Ville</Label>
        <Input name="city" />
      </div>
      <div>
        <Label>Pays</Label>
        <Input name="country" defaultValue="France" />
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
