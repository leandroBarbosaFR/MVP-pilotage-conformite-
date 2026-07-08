import { requireContext } from "@/lib/queries/auth";
import { getDocuments, getDocumentLinkMap, getProfiles } from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { UploadDocument } from "@/components/documents/upload-document";
import { statusFromDate } from "@/lib/status";
import { DOCUMENT_TYPES, DOCUMENT_MODULE_OPTIONS } from "@/types/enums";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

const DOC_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "COMPLIANT", label: "Valide" },
  { value: "EXPIRING_SOON", label: "Bientôt expiré" },
  { value: "EXPIRED", label: "Expiré" },
];

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    archived?: string;
    page?: string;
    type?: string;
    module?: string;
    status?: string;
    responsible?: string;
  }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";

  const [{ rows, count }, profiles] = await Promise.all([
    getDocuments(company.id, {
      search: sp.q,
      category: sp.type,
      module: sp.module,
      status: sp.status,
      responsible: sp.responsible,
      includeArchived,
      page,
      pageSize: PAGE_SIZE,
    }),
    getProfiles(company.id),
  ]);
  const links = await getDocumentLinkMap(company.id, rows);

  const profName = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  return (
    <div>
      <PageHeader
        title="Documents et preuves"
        description="Pièces justificatives et preuves de conformité, rattachées à n'importe quel module (site, véhicule, salarié, prestataire, contrat, audit…)."
        action={
          <AddPanel title="Ajouter un document">
            <UploadDocument companyId={company.id} />
          </AddPanel>
        }
      />

      <ListToolbar basePath="/dashboard/documents" search={sp.q} includeArchived={includeArchived}>
        <Select name="module" defaultValue={sp.module ?? ""} className="w-48">
          <option value="">Tous les modules</option>
          {DOCUMENT_MODULE_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </Select>
        <Select name="type" defaultValue={sp.type ?? ""} className="w-44">
          <option value="">Tous les types</option>
          {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select name="status" defaultValue={sp.status ?? ""} className="w-40">
          <option value="">Tous statuts</option>
          {DOC_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Select name="responsible" defaultValue={sp.responsible ?? ""} className="w-44">
          <option value="">Tous responsables</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>
          ))}
        </Select>
      </ListToolbar>

      <ListView
        rows={rows}
        getKey={(d) => d.id}
        href={(d) => `/dashboard/documents/${d.id}`}
        empty="Aucun document."
        columns={[
          { header: "Titre", cell: (d) => <span className="font-medium">{d.title}</span> },
          { header: "Type", cell: (d) => d.document_type ?? "—" },
          { header: "Module", cell: (d) => links.get(d.id)?.module ?? "—" },
          { header: "Entité liée", cell: (d) => links.get(d.id)?.label ?? "—" },
          { header: "Expiration", cell: (d) => <span className="inline-flex items-center gap-2">{formatDate(d.expiration_date)}<StatusBadge status={statusFromDate(d.expiration_date)} /></span> },
          { header: "Responsable", cell: (d) => profName(d.responsible_id) },
        ]}
        card={(d) => ({
          title: d.title,
          badge: <StatusBadge status={statusFromDate(d.expiration_date)} />,
          fields: [
            { label: "Module", value: links.get(d.id)?.module ?? "—" },
            { label: "Entité liée", value: links.get(d.id)?.label ?? "—" },
            { label: "Expiration", value: formatDate(d.expiration_date) },
          ],
        })}
        actions={(d) => (
          <>
            {d.file_url ? (
              <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">Ouvrir</Button>
              </a>
            ) : null}
            <ArchiveButton table="documents" id={d.id} archived={d.is_archived} />
          </>
        )}
      />

      <Pagination
        basePath="/dashboard/documents"
        page={page}
        count={count}
        pageSize={PAGE_SIZE}
        params={{ q: sp.q, archived: sp.archived, type: sp.type, module: sp.module, status: sp.status, responsible: sp.responsible }}
      />
    </div>
  );
}
