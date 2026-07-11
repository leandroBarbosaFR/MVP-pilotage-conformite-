import { notFound } from "next/navigation";
import { requireContext } from "@/lib/queries/auth";
import { getAction, getProfiles } from "@/lib/queries/entities";
import { updateAction } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { AddPanel, SubmitButton } from "@/components/app/add-panel";
import { ArchiveButton } from "@/components/app/archive-button";
import { DetailGrid, DetailField } from "@/components/app/detail-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  ACTION_STATUS_LABELS,
  PRIORITY_LABELS,
  complianceFromActionStatus,
  statusFromDate,
} from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { ActionRow, Profile } from "@/lib/types/database";

export default async function ActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requireContext();

  const [action, profiles] = await Promise.all([getAction(id), getProfiles(company.id)]);
  if (!action) notFound();

  const pName = (pid: string | null) => {
    if (!pid) return "—";
    const p = profiles.find((x) => x.id === pid);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "—";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/actions"
        backLabel="Retour aux actions"
        title={action.title}
        action={
          <>
            <AddPanel label="Modifier" title="Modifier l'action">
              <ActionEditForm action={action} profiles={profiles} />
            </AddPanel>
            <ArchiveButton table="actions" id={action.id} archived={action.is_archived} />
          </>
        }
      />

      <DetailGrid>
        <DetailField label="Titre" value={action.title} />
        <DetailField label="Description" value={action.description} />
        <DetailField
          label="Statut"
          value={<StatusBadge status={complianceFromActionStatus(action.status)} label={ACTION_STATUS_LABELS[action.status]} />}
        />
        <DetailField label="Priorité" value={PRIORITY_LABELS[action.priority]} />
        <DetailField
          label="Échéance"
          value={
            <span className="inline-flex items-center gap-2">
              {formatDate(action.due_date)}
              <StatusBadge status={statusFromDate(action.due_date)} />
            </span>
          }
        />
        <DetailField label="Assignée à" value={pName(action.assigned_to)} />
        <DetailField label="Superviseur" value={pName(action.supervisor_id)} />
        <DetailField label="Commentaire" value={action.comment} />
        <DetailField label="Créée le" value={formatDate(action.created_at)} />
        <DetailField label="Mise à jour" value={formatDate(action.updated_at)} />
      </DetailGrid>
    </div>
  );
}

function ActionEditForm({ action, profiles }: { action: ActionRow; profiles: Profile[] }) {
  const profOptions = profiles.map((p) => (
    <option key={p.id} value={p.id}>{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</option>
  ));
  return (
    <form action={updateAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={action.id} />
      <div className="sm:col-span-2">
        <Label>Titre</Label>
        <Input name="title" defaultValue={action.title} required />
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Textarea name="description" defaultValue={action.description ?? ""} rows={2} />
      </div>
      <div>
        <Label>Assignée à</Label>
        <Select name="assigned_to" defaultValue={action.assigned_to ?? ""}>
          <option value="">Non assigné</option>
          {profOptions}
        </Select>
      </div>
      <div>
        <Label>Superviseur</Label>
        <Select name="supervisor_id" defaultValue={action.supervisor_id ?? ""}>
          <option value="">Non assigné</option>
          {profOptions}
        </Select>
      </div>
      <div>
        <Label>Échéance</Label>
        <Input name="due_date" type="date" defaultValue={action.due_date ?? ""} />
      </div>
      <div>
        <Label>Priorité</Label>
        <Select name="priority" defaultValue={action.priority}>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      <div>
        <Label>Statut</Label>
        <Select name="status" defaultValue={action.status}>
          {Object.entries(ACTION_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Commentaire</Label>
        <Textarea name="comment" defaultValue={action.comment ?? ""} rows={2} />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>Enregistrer les modifications</SubmitButton>
      </div>
    </form>
  );
}
