import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import {
  getEmployee,
  getEmployeeCertifications,
  getEmployeeAbsences,
  getEmployeeEpi,
  getLinkedObligations,
  getLinkedDocuments,
  getProfiles,
  getSiteOptions,
} from "@/lib/queries/entities";
import { createCertification, createAbsence, updateAbsence } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AvatarUpload } from "@/components/employees/avatar-upload";
import { AddPanel, SubmitButton } from "@/components/app/add-panel";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField, DetailSection } from "@/components/app/detail-field";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/app/clickable-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  CATEGORY_LABELS,
  OBLIGATION_STATUS_LABELS,
  PRIORITY_LABELS,
  complianceFromObligationStatus,
  statusFromDate,
} from "@/lib/status";
import {
  CERTIFICATION_TYPE_LABELS,
  CERTIFICATION_CATEGORIES,
  CertificationType,
  APTITUDE_LABELS,
  AptitudeStatus,
  WORK_STATUS_LABELS,
  WORK_STATUS_OPTIONS,
  PriorityLevel,
} from "@/types/enums";
import { formatDate } from "@/lib/utils";
import type { Profile, EmployeeAbsence } from "@/lib/types/database";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requireContext();

  const employee = await getEmployee(id);
  if (!employee) notFound();

  const [certifications, absences, epis, obligations, documents, profiles, sites] = await Promise.all([
    getEmployeeCertifications(id),
    getEmployeeAbsences(id),
    getEmployeeEpi(id),
    getLinkedObligations("linked_employee_id", id),
    getLinkedDocuments("employee_id", id),
    getProfiles(company.id),
    getSiteOptions(company.id),
  ]);

  const fullName = [employee.first_name, employee.last_name].filter(Boolean).join(" ");
  const siteName = employee.site_id ? sites.find((s) => s.id === employee.site_id)?.name ?? "—" : "—";
  const profName = (pid: string | null) => {
    if (!pid) return "—";
    const p = profiles.find((x) => x.id === pid);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/employees"
        backLabel="Retour au personnel"
        title={fullName || "Collaborateur"}
        description={[employee.job_family ?? employee.job_title, siteName !== "—" ? siteName : null].filter(Boolean).join(" · ") || undefined}
        action={<ArchiveButton table="employees" id={employee.id} archived={employee.is_archived} />}
      />

      <div className="rounded-md border border-border p-4">
        <AvatarUpload employeeId={id} name={fullName} current={employee.avatar_url} />
      </div>

      {/* A. Informations générales */}
      <DetailGrid>
        <DetailField label="Nom" value={fullName} />
        <DetailField label="Poste" value={employee.job_title} />
        <DetailField label="Métier / fonction" value={employee.job_family} />
        <DetailField label="Service" value={employee.service} />
        <DetailField label="Site / agence" value={siteName === "—" ? null : siteName} />
        <DetailField label="Type de contrat" value={employee.contract_type} />
        <DetailField label="Date d'entrée" value={formatDate(employee.hire_date)} />
        <DetailField label="Fin de contrat" value={formatDate(employee.contract_end_date)} />
        <DetailField label="Statut" value={WORK_STATUS_LABELS[employee.status] ?? employee.status} />
        <DetailField label="Email" value={employee.email} />
        <DetailField label="Téléphone" value={employee.phone} />
        <DetailField label="Responsable" value={profName(employee.responsible_id)} />
        <DetailField label="Superviseur" value={profName(employee.supervisor_id)} />
      </DetailGrid>

      {/* B. Formations, habilitations, visites médicales, permis, EPI */}
      <DetailSection title="Formations & habilitations">
        <div className="mb-3">
          <AddPanel label="Ajouter une échéance" title="Nouvelle formation / habilitation">
            <CertificationForm employeeId={id} profiles={profiles} />
          </AddPanel>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Type</TH>
              <TH>Intitulé</TH>
              <TH>Obtention</TH>
              <TH>Expiration</TH>
              <TH>Statut</TH>
              <TH>Priorité</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <tbody>
            {certifications.length === 0 ? (
              <EmptyRow colSpan={7} message="Aucune formation ou habilitation." />
            ) : (
              certifications.map((c) => (
                <TR key={c.id}>
                  <TD>{CERTIFICATION_TYPE_LABELS[c.type] ?? c.type}</TD>
                  <TD className="font-medium">{c.category ?? c.title}</TD>
                  <TD>{formatDate(c.obtained_date)}</TD>
                  <TD>{formatDate(c.expiry_date)}</TD>
                  <TD>
                    <StatusBadge
                      status={complianceFromObligationStatus(c.status)}
                      label={OBLIGATION_STATUS_LABELS[c.status]}
                    />
                  </TD>
                  <TD>{PRIORITY_LABELS[c.priority]}</TD>
                  <TD className="text-right">
                    <ArchiveButton table="employee_certifications" id={c.id} archived={c.is_archived} />
                  </TD>
                </TR>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Absences & aptitude — accès restreint, aucun diagnostic médical */}
      <DetailSection title="Absences & aptitude">
        <p className="mb-3 text-xs text-muted-foreground">
          Suivi opérationnel des absences et de l&apos;aptitude au poste. Aucune donnée de diagnostic médical.
          Accès réservé aux profils autorisés.
        </p>
        <div className="mb-3">
          <AddPanel label="Déclarer une absence" title="Nouvelle absence / aptitude">
            <AbsenceForm employeeId={id} />
          </AddPanel>
        </div>
        {absences.length === 0 ? (
          <p className="rounded-md border border-border bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
            Aucune absence enregistrée.
          </p>
        ) : (
          <div className="space-y-3">
            {absences.map((a) => (
              <div key={a.id} className="rounded-md border border-border p-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                  <DetailField label="Statut" value={WORK_STATUS_LABELS[a.work_status] ?? a.work_status} />
                  <DetailField label="Début" value={formatDate(a.start_date)} />
                  <DetailField label="Fin prévue" value={formatDate(a.expected_end_date)} />
                  <DetailField label="Reprise" value={formatDate(a.return_date)} />
                  <DetailField label="Aptitude" value={a.aptitude ? APTITUDE_LABELS[a.aptitude] : "—"} />
                  <DetailField label="Restrictions" value={a.restrictions} />
                  <DetailField label="Prochaine visite médicale" value={formatDate(a.next_medical_visit)} />
                  <DetailField label="Visite de reprise" value={a.return_visit_required ? "À prévoir" : "—"} />
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                  <AddPanel label="Modifier" title="Modifier l'absence">
                    <AbsenceForm employeeId={id} absence={a} />
                  </AddPanel>
                  <ArchiveButton table="employee_absences" id={a.id} archived={a.is_archived} />
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailSection>

      {/* EPI attribués */}
      <DetailSection title="EPI attribués">
        <Table>
          <THead>
            <TR>
              <TH>EPI</TH>
              <TH>Référence</TH>
              <TH>Remise</TH>
              <TH>Renouvellement</TH>
              <TH>Statut</TH>
            </TR>
          </THead>
          <tbody>
            {epis.length === 0 ? (
              <EmptyRow colSpan={5} message="Aucun EPI attribué." />
            ) : (
              epis.map((e) => (
                <ClickableRow key={e.id} href={`/dashboard/epi/${e.id}`}>
                  <TD className="font-medium">{e.epi_type}</TD>
                  <TD>{e.internal_reference ?? "—"}</TD>
                  <TD>{formatDate(e.issue_date)}</TD>
                  <TD>{formatDate(e.renewal_date)}</TD>
                  <TD>
                    <StatusBadge status={statusFromDate(e.renewal_date)} />
                  </TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Obligations liées */}
      <DetailSection title="Obligations liées">
        <Table>
          <THead>
            <TR>
              <TH>Titre</TH>
              <TH>Catégorie</TH>
              <TH>Échéance</TH>
              <TH>Statut</TH>
            </TR>
          </THead>
          <tbody>
            {obligations.length === 0 ? (
              <EmptyRow colSpan={4} message="Aucun élément." />
            ) : (
              obligations.map((o) => (
                <ClickableRow key={o.id} href={`/dashboard/obligations/${o.id}`}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/obligations/${o.id}`} className="hover:underline">{o.title}</Link>
                  </TD>
                  <TD>{CATEGORY_LABELS[o.category]}</TD>
                  <TD>{formatDate(o.due_date)}</TD>
                  <TD>
                    <StatusBadge
                      status={complianceFromObligationStatus(o.status)}
                      label={OBLIGATION_STATUS_LABELS[o.status]}
                    />
                  </TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>

      {/* Documents liés */}
      <DetailSection title="Documents liés">
        <Table>
          <THead>
            <TR>
              <TH>Titre</TH>
              <TH>Type</TH>
              <TH>Expiration</TH>
            </TR>
          </THead>
          <tbody>
            {documents.length === 0 ? (
              <EmptyRow colSpan={3} message="Aucun élément." />
            ) : (
              documents.map((d) => (
                <ClickableRow key={d.id} href={`/dashboard/documents/${d.id}`}>
                  <TD className="font-medium">
                    <Link href={`/dashboard/documents/${d.id}`} className="hover:underline">{d.title}</Link>
                  </TD>
                  <TD>{d.document_type ?? "—"}</TD>
                  <TD>{formatDate(d.expiration_date)}</TD>
                </ClickableRow>
              ))
            )}
          </tbody>
        </Table>
      </DetailSection>
    </div>
  );
}

function CertificationForm({ employeeId, profiles }: { employeeId: string; profiles: Profile[] }) {
  return (
    <form action={createCertification} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="employee_id" value={employeeId} />
      <div>
        <Label>Type</Label>
        <Select name="type" defaultValue={CertificationType.HABILITATION}>
          {Object.values(CertificationType).map((t) => (
            <option key={t} value={t}>{CERTIFICATION_TYPE_LABELS[t]}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Catégorie</Label>
        <Input name="category" list="cert-categories" placeholder="CACES R489, FIMO…" />
        <datalist id="cert-categories">
          {CERTIFICATION_CATEGORIES.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>
      <div className="sm:col-span-2">
        <Label>Intitulé</Label>
        <Input name="title" required placeholder="Ex : CACES R489 catégorie 3" />
      </div>
      <div>
        <Label>Date d&apos;obtention</Label>
        <Input name="obtained_date" type="date" />
      </div>
      <div>
        <Label>Date d&apos;expiration</Label>
        <Input name="expiry_date" type="date" />
      </div>
      <div>
        <Label>Priorité</Label>
        <Select name="priority" defaultValue={PriorityLevel.MEDIUM}>
          {Object.values(PriorityLevel).map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Responsable</Label>
        <Select name="responsible_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Commentaire</Label>
        <Textarea name="notes" rows={2} />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>Enregistrer l&apos;échéance</SubmitButton>
      </div>
    </form>
  );
}

function AbsenceForm({ employeeId, absence }: { employeeId: string; absence?: EmployeeAbsence }) {
  const edit = !!absence;
  const uid = absence?.id ?? "new";
  return (
    <form action={edit ? updateAbsence : createAbsence} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="employee_id" value={employeeId} />
      {edit ? <input type="hidden" name="id" value={absence.id} /> : null}
      <div>
        <Label>Statut</Label>
        <Select name="work_status" defaultValue={absence?.work_status ?? "absent"}>
          {WORK_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{WORK_STATUS_LABELS[s] ?? s}</option>)}
        </Select>
      </div>
      <div>
        <Label>Aptitude</Label>
        <Select name="aptitude" defaultValue={absence?.aptitude ?? ""}>
          <option value="">Non renseignée</option>
          {Object.values(AptitudeStatus).map((a) => <option key={a} value={a}>{APTITUDE_LABELS[a]}</option>)}
        </Select>
      </div>
      <div>
        <Label>Début</Label>
        <Input name="start_date" type="date" defaultValue={absence?.start_date ?? ""} />
      </div>
      <div>
        <Label>Fin prévue</Label>
        <Input name="expected_end_date" type="date" defaultValue={absence?.expected_end_date ?? ""} />
      </div>
      <div>
        <Label>Date de reprise</Label>
        <Input name="return_date" type="date" defaultValue={absence?.return_date ?? ""} />
      </div>
      <div>
        <Label>Prochaine visite médicale</Label>
        <Input name="next_medical_visit" type="date" defaultValue={absence?.next_medical_visit ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <Label>Restrictions (non médicales)</Label>
        <Input name="restrictions" defaultValue={absence?.restrictions ?? ""} placeholder="Port de charge, conduite, horaires…" />
      </div>
      <div className="flex items-center gap-2">
        <input id={`sick-${uid}`} name="is_sick_leave" type="checkbox" defaultChecked={absence?.is_sick_leave ?? false} className="h-4 w-4 accent-accent" />
        <Label className="mb-0" htmlFor={`sick-${uid}`}>Arrêt maladie</Label>
      </div>
      <div className="flex items-center gap-2">
        <input id={`rv-${uid}`} name="return_visit_required" type="checkbox" defaultChecked={absence?.return_visit_required ?? false} className="h-4 w-4 accent-accent" />
        <Label className="mb-0" htmlFor={`rv-${uid}`}>Visite de reprise à prévoir</Label>
      </div>
      <div className="sm:col-span-2">
        <Label>Notes internes (non médicales)</Label>
        <Textarea name="internal_notes" rows={2} defaultValue={absence?.internal_notes ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>{edit ? "Enregistrer les modifications" : "Enregistrer"}</SubmitButton>
      </div>
    </form>
  );
}
