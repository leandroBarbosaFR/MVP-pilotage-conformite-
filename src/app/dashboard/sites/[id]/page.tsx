import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import { getSiteDetail, getProfiles } from "@/lib/queries/entities";
import { createObligation } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel } from "@/components/app/add-panel";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField, DetailSection } from "@/components/app/detail-field";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/app/clickable-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import {
  OBLIGATION_STATUS_LABELS,
  complianceFromObligationStatus,
  complianceFromActionStatus,
  ACTION_STATUS_LABELS,
  CATEGORY_LABELS,
  FREQUENCY_LABELS,
  PRIORITY_LABELS,
  statusFromDate,
} from "@/lib/status";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_TONE,
  AUDIT_STATUS_LABELS,
  AUDIT_STATUS_TONE,
  NC_STATUS_LABELS,
  NC_STATUS_TONE,
  INCIDENT_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_STATUS_TONE,
  PRIORITY_TONE,
  PriorityLevel,
} from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { ComplianceStatus, Profile, Provider } from "@/lib/types/database";

const today = () => new Date().toISOString().slice(0, 10);

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireContext();

  const [detail, profiles] = await Promise.all([getSiteDetail(id), getProfiles(company.id)]);
  const {
    site, obligations, contracts, audits, documents, providers, actions,
    nonConformities, incidents, providerName, profileName, docByObligation, history,
  } = detail;
  if (!site) notFound();

  const t = today();
  const lateObligations = obligations.filter((o) => complianceFromObligationStatus(o.status) === "danger").length;
  const lateActions = actions.filter((a) => a.status !== "DONE" && a.due_date && a.due_date < t).length;
  const pName = (pid: string | null) => (pid ? profileName.get(pid) ?? "—" : "—");
  const prName = (pid: string | null) => (pid ? providerName.get(pid) ?? "—" : "—");

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/sites"
        backLabel="Retour aux sites"
        title={site.name}
        description={[site.site_type, site.city].filter(Boolean).join(" · ") || undefined}
        action={<ArchiveButton table="sites" id={site.id} archived={site.is_archived} />}
      />

      {/* A. Informations générales */}
      <DetailGrid>
        <DetailField label="Type de site" value={site.site_type} />
        <DetailField label="Activité" value={site.activity_type} />
        <DetailField label="Adresse" value={site.address} />
        <DetailField label="Ville" value={[site.postal_code, site.city].filter(Boolean).join(" ")} />
        <DetailField label="Pays" value={site.country} />
        <DetailField label="Surface" value={site.surface_area ? `${site.surface_area} m²` : null} />
        <DetailField label="Responsable" value={pName(site.manager_id)} />
        <DetailField label="Superviseur" value={pName(site.supervisor_id)} />
        <DetailField label="Statut" value={site.status} />
        <DetailField label="Obligations en retard" value={lateObligations} />
        <DetailField label="Documents rattachés" value={documents.length} />
        <DetailField label="Actions en retard" value={lateActions} />
      </DetailGrid>

      {/* B/C/D. Sécurité, installations & contrôles réglementaires (relationnel) */}
      <DetailSection title="Sécurité, installations & contrôles réglementaires">
        <div className="mb-3">
          <AddPanel label="Ajouter une obligation" title="Nouvelle obligation du site">
            <SiteObligationForm siteId={id} profiles={profiles} providers={providers} />
          </AddPanel>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Obligation</TH>
              <TH>Catégorie</TH>
              <TH>Prochaine échéance</TH>
              <TH>Fréquence</TH>
              <TH>Responsable</TH>
              <TH>Prestataire</TH>
              <TH>Statut</TH>
              <TH>Document</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <tbody>
            {obligations.length === 0 ? (
              <EmptyRow colSpan={9} message="Aucune obligation liée au site." />
            ) : (
              obligations.map((o) => (
                <TR key={o.id}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/obligations/${o.id}`} className="hover:underline">{o.title}</Link>
                  </TD>
                  <TD>{CATEGORY_LABELS[o.category] ?? o.category}</TD>
                  <TD>{formatDate(o.due_date)}</TD>
                  <TD>{FREQUENCY_LABELS[o.frequency] ?? o.frequency}</TD>
                  <TD>{pName(o.responsible_id)}</TD>
                  <TD>{prName(o.provider_id)}</TD>
                  <TD>
                    <StatusBadge status={complianceFromObligationStatus(o.status)} label={OBLIGATION_STATUS_LABELS[o.status]} />
                  </TD>
                  <TD>{docByObligation.has(o.id) ? "Oui" : <span className="text-status-danger">Manquant</span>}</TD>
                  <TD className="text-right">
                    <ArchiveButton table="obligations" id={o.id} archived={o.is_archived} />
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* E. Documents liés */}
      <DetailSection title="Documents & preuves">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Type</TH><TH>Expiration</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {documents.length === 0 ? (
              <EmptyRow colSpan={4} message="Aucun document lié." />
            ) : (
              documents.map((d) => (
                <ClickableRow key={d.id} href={`/dashboard/documents/${d.id}`}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/documents/${d.id}`} className="hover:underline">{d.title}</Link>
                  </TD>
                  <TD>{d.document_type ?? "—"}</TD>
                  <TD>{formatDate(d.expiration_date)}</TD>
                  <TD><StatusBadge status={statusFromDate(d.expiration_date)} /></TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* F. Contrats liés */}
      <DetailSection title="Contrats liés">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Type</TH><TH>Prestataire</TH><TH>Fin</TH><TH>Renouvellement</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {contracts.length === 0 ? (
              <EmptyRow colSpan={6} message="Aucun contrat lié." />
            ) : (
              contracts.map((c) => (
                <ClickableRow key={c.id} href={`/dashboard/contracts/${c.id}`}>
                  <TD className="font-medium">{c.title}</TD>
                  <TD>{c.contract_type ?? "—"}</TD>
                  <TD>{prName(c.provider_id)}</TD>
                  <TD>{formatDate(c.end_date)}</TD>
                  <TD>{formatDate(c.renewal_date)}</TD>
                  <TD>
                    <StatusBadge status={(CONTRACT_STATUS_TONE[c.status] ?? "none") as ComplianceStatus} label={CONTRACT_STATUS_LABELS[c.status] ?? c.status} />
                  </TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* G. Prestataires liés */}
      <DetailSection title="Prestataires liés">
        <Table>
          <THead>
            <TR><TH>Nom</TH><TH>Type</TH><TH>Contact</TH><TH>Email</TH><TH>Téléphone</TH></TR>
          </THead>
          <tbody>
            {providers.length === 0 ? (
              <EmptyRow colSpan={5} message="Aucun prestataire lié." />
            ) : (
              providers.map((p) => (
                <ClickableRow key={p.id} href={`/dashboard/providers/${p.id}`}>
                  <TD className="font-medium">{p.name}</TD>
                  <TD>{p.provider_type ?? "—"}</TD>
                  <TD>{p.contact_name ?? "—"}</TD>
                  <TD>{p.email ?? "—"}</TD>
                  <TD>{p.phone ?? "—"}</TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* H. Actions liées */}
      <DetailSection title="Actions liées">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Assigné à</TH><TH>Priorité</TH><TH>Échéance</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {actions.length === 0 ? (
              <EmptyRow colSpan={5} message="Aucune action liée." />
            ) : (
              actions.map((a) => (
                <ClickableRow key={a.id} href={`/dashboard/actions/${a.id}`}>
                  <TD className="font-medium">{a.title}</TD>
                  <TD>{pName(a.assigned_to)}</TD>
                  <TD>{PRIORITY_LABELS[a.priority] ?? a.priority}</TD>
                  <TD>{formatDate(a.due_date)}</TD>
                  <TD>
                    <StatusBadge status={complianceFromActionStatus(a.status)} label={ACTION_STATUS_LABELS[a.status]} />
                  </TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* I. Non-conformités liées */}
      <DetailSection title="Non-conformités liées">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Source</TH><TH>Gravité</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {nonConformities.length === 0 ? (
              <EmptyRow colSpan={4} message="Aucune non-conformité liée." />
            ) : (
              nonConformities.map((n) => (
                <TR key={n.id}>
                  <TD className="font-medium">{n.title}</TD>
                  <TD>{n.source_type ?? "—"}</TD>
                  <TD>
                    <StatusBadge status={(PRIORITY_TONE[n.severity] ?? "none") as ComplianceStatus} label={PRIORITY_LABELS[n.severity] ?? n.severity} />
                  </TD>
                  <TD>
                    <StatusBadge status={(NC_STATUS_TONE[n.status] ?? "none") as ComplianceStatus} label={NC_STATUS_LABELS[n.status] ?? n.status} />
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Incidents & observations liés */}
      <DetailSection title="Incidents & observations">
        <Table>
          <THead>
            <TR><TH>Type</TH><TH>Titre</TH><TH>Zone</TH><TH>Date</TH><TH>Gravité</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {incidents.length === 0 ? (
              <EmptyRow colSpan={6} message="Aucun incident lié." />
            ) : (
              incidents.map((n) => (
                <ClickableRow key={n.id} href={`/dashboard/incidents/${n.id}`}>
                  <TD>{INCIDENT_TYPE_LABELS[n.type] ?? n.type}</TD>
                  <TD className="font-medium">{n.title}</TD>
                  <TD>{n.zone ?? "—"}</TD>
                  <TD>{formatDate(n.occurred_at)}</TD>
                  <TD>
                    <StatusBadge status={(PRIORITY_TONE[n.severity] ?? "none") as ComplianceStatus} label={PRIORITY_LABELS[n.severity] ?? n.severity} />
                  </TD>
                  <TD>
                    <StatusBadge status={(INCIDENT_STATUS_TONE[n.status] ?? "none") as ComplianceStatus} label={INCIDENT_STATUS_LABELS[n.status] ?? n.status} />
                  </TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Audits & inspections */}
      <DetailSection title="Audits & inspections">
        <Table>
          <THead>
            <TR><TH>Titre</TH><TH>Date prévue</TH><TH>Statut</TH></TR>
          </THead>
          <tbody>
            {audits.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucun audit lié." />
            ) : (
              audits.map((a) => (
                <TR key={a.id}>
                  <TD className="font-medium">{a.title}</TD>
                  <TD>{formatDate(a.planned_date)}</TD>
                  <TD>
                    <StatusBadge status={(AUDIT_STATUS_TONE[a.status] ?? "none") as ComplianceStatus} label={AUDIT_STATUS_LABELS[a.status] ?? a.status} />
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* J. Historique */}
      <DetailSection title="Historique du site">
        <Table>
          <THead>
            <TR><TH>Date</TH><TH>Type d&apos;événement</TH><TH>Description</TH></TR>
          </THead>
          <tbody>
            {history.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucun événement." />
            ) : (
              history.map((h, i) => (
                <TR key={i}>
                  <TD>{formatDate(h.date)}</TD>
                  <TD>{h.type}</TD>
                  <TD>{h.description}</TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>
    </div>
  );
}

function SiteObligationForm({
  siteId,
  profiles,
  providers,
}: {
  siteId: string;
  profiles: Profile[];
  providers: Provider[];
}) {
  return (
    <form action={createObligation} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="module" value="SITES" />
      <input type="hidden" name="related_entity_type" value="SITE" />
      <input type="hidden" name="related_entity_id" value={siteId} />
      <input type="hidden" name="category" value="site" />
      <div className="sm:col-span-2">
        <Label>Intitulé</Label>
        <Input name="title" required placeholder="Ex : Contrôle extincteurs, vérification électrique…" />
      </div>
      <div>
        <Label>Prochaine échéance</Label>
        <Input name="due_date" type="date" />
      </div>
      <div>
        <Label>Fréquence</Label>
        <Select name="frequency" defaultValue="annuelle">
          {Object.entries(FREQUENCY_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </Select>
      </div>
      <div>
        <Label>Priorité</Label>
        <Select name="priority" defaultValue={PriorityLevel.MEDIUM}>
          {Object.values(PriorityLevel).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </Select>
      </div>
      <div>
        <Label>Prestataire</Label>
        <Select name="provider_id" defaultValue="">
          <option value="">Aucun</option>
          {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Responsable</Label>
        <Select name="responsible_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>)}
        </Select>
      </div>
      <div>
        <Label>Document attendu</Label>
        <Input name="expected_document" placeholder="Ex : Rapport de contrôle" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Enregistrer l&apos;obligation</Button>
      </div>
    </form>
  );
}
