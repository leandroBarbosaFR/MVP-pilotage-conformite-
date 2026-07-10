import Link from "next/link";
import { requireContext } from "@/lib/queries/auth";
import {
  getDocuments,
  getDocumentLinkMap,
  getProfiles,
  getMissingDocumentObligations,
  getEntityNameMap,
} from "@/lib/queries/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ListToolbar } from "@/components/app/list-toolbar";
import { Pagination } from "@/components/app/pagination";
import { ArchiveButton } from "@/components/app/archive-button";
import { ReminderButton } from "@/components/app/reminder-button";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { ListView } from "@/components/app/list-view";
import { StatusBadge } from "@/components/ui/status-badge";
import { UploadDocument } from "@/components/documents/upload-document";
import { statusFromDate, OBLIGATION_STATUS_LABELS, complianceFromObligationStatus } from "@/lib/status";
import { DOCUMENT_TYPES, DOCUMENT_MODULE_OPTIONS, MODULE_LABELS, RELATED_ENTITY_LABELS } from "@/types/enums";
import { cn, formatDate } from "@/lib/utils";
import type { ObligationModule, RelatedEntityType } from "@/lib/types/database";

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
    view?: string;
  }>;
}) {
  const sp = await searchParams;
  const { company } = await requireContext();
  const page = Math.max(1, Number(sp.page ?? 1));
  const includeArchived = sp.archived === "1";
  const missingView = sp.view === "missing";

  const Tabs = (
    <div className="mb-4 flex items-center gap-2">
      <Link
        href="/dashboard/documents"
        className={cn(
          "rounded-md border px-3 py-1.5 text-sm transition-colors",
          !missingView ? "border-accent/40 bg-accent/10 text-foreground" : "border-border bg-surface text-muted-foreground hover:bg-muted"
        )}
      >
        Tous les documents
      </Link>
      <Link
        href="/dashboard/documents?view=missing"
        className={cn(
          "rounded-md border px-3 py-1.5 text-sm transition-colors",
          missingView ? "border-accent/40 bg-accent/10 text-foreground" : "border-border bg-surface text-muted-foreground hover:bg-muted"
        )}
      >
        Documents manquants
      </Link>
    </div>
  );

  if (missingView) {
    const [{ rows, count }, profiles, names] = await Promise.all([
      getMissingDocumentObligations(company.id, { search: sp.q, page, pageSize: PAGE_SIZE }),
      getProfiles(company.id),
      getEntityNameMap(company.id),
    ]);
    const profName = (id: string | null) => {
      if (!id) return "—";
      const p = profiles.find((x) => x.id === id);
      return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
    };
    const entityLabel = (rt: string | null, rid: string | null) =>
      rid ? `${RELATED_ENTITY_LABELS[rt as RelatedEntityType] ?? ""} ${names.get(rid) ?? ""}`.trim() || "—" : "—";

    return (
      <div>
        <PageHeader
          title="Documents et preuves"
          description="Justificatifs attendus mais absents du suivi : ajoutez la preuve ou relancez le responsable."
        />
        {Tabs}
        <ListToolbar basePath="/dashboard/documents" search={sp.q}>
          <input type="hidden" name="view" value="missing" />
        </ListToolbar>

        <ListView
          rows={rows}
          getKey={(o) => o.id}
          empty="Aucun document manquant. Tout est à jour."
          columns={[
            { header: "Document attendu", cell: (o) => <span className="font-medium">{o.expected_document ?? o.title}</span> },
            { header: "Module", cell: (o) => MODULE_LABELS[o.module as ObligationModule] ?? o.module },
            { header: "Élément lié", cell: (o) => entityLabel(o.related_entity_type, o.related_entity_id) },
            { header: "Responsable", cell: (o) => profName(o.responsible_id) },
            { header: "Échéance", cell: (o) => formatDate(o.due_date) },
            { header: "Statut", cell: (o) => <StatusBadge status={complianceFromObligationStatus(o.status)} label={OBLIGATION_STATUS_LABELS[o.status]} /> },
          ]}
          card={(o) => ({
            title: o.expected_document ?? o.title,
            badge: <StatusBadge status={complianceFromObligationStatus(o.status)} label={OBLIGATION_STATUS_LABELS[o.status]} />,
            fields: [
              { label: "Module", value: MODULE_LABELS[o.module as ObligationModule] ?? o.module },
              { label: "Élément lié", value: entityLabel(o.related_entity_type, o.related_entity_id) },
              { label: "Échéance", value: formatDate(o.due_date) },
            ],
          })}
          href={(o) => `/dashboard/obligations/${o.id}`}
          actions={(o) => (
            <ReminderButton
              label={o.expected_document ?? o.title}
              relatedType={o.related_entity_type}
              relatedId={o.related_entity_id}
              responsibleId={o.responsible_id}
            />
          )}
        />

        <Pagination basePath="/dashboard/documents" page={page} count={count} pageSize={PAGE_SIZE} params={{ q: sp.q, view: "missing" }} />
      </div>
    );
  }

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
      {Tabs}

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
