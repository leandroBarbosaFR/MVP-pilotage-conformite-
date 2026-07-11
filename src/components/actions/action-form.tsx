"use client";

import { useState } from "react";
import { createAction } from "@/lib/actions/entities";
import { SubmitButton } from "@/components/app/add-panel";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { RELATED_ENTITY_LABELS } from "@/types/enums";
import { ACTION_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/status";
import type { Profile } from "@/lib/types/database";
import type { EntityOption } from "@/components/obligations/obligation-form";

export type { EntityOption };

// Types d'entité pour lesquels on propose une sélection concrète
const ENTITY_TYPE_ORDER = ["VEHICLE", "EMPLOYEE", "DRIVER", "EQUIPMENT", "SITE"] as const;

export function ActionForm({
  profiles,
  obligations,
  entities,
}: {
  profiles: Profile[];
  obligations: { id: string; title: string }[];
  entities: Record<string, EntityOption[]>;
}) {
  const [relatedType, setRelatedType] = useState("");
  const entityOptions = entities[relatedType] ?? [];

  const profileLabel = (p: Profile) =>
    [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—";

  return (
    <form action={createAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Titre</Label>
        <Input name="title" required />
      </div>

      <div>
        <Label>Catégorie</Label>
        <Input name="category" placeholder="RH, Maintenance, Parc…" />
      </div>
      <div>
        <Label>Statut</Label>
        <Select name="status" defaultValue="TODO">
          {Object.entries(ACTION_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Priorité</Label>
        <Select name="priority" defaultValue="MEDIUM">
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Date d&apos;échéance</Label>
        <Input name="due_date" type="date" />
      </div>

      {/* Rattachement à une entité concrète */}
      <div>
        <Label>Type d&apos;entité liée</Label>
        <Select
          name="related_entity_type"
          value={relatedType}
          onChange={(e) => setRelatedType(e.target.value)}
        >
          <option value="">— Aucune —</option>
          {ENTITY_TYPE_ORDER.map((t) => (
            <option key={t} value={t}>{RELATED_ENTITY_LABELS[t]}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Entité liée</Label>
        <Select key={relatedType} name="related_entity_id" defaultValue="" disabled={!relatedType}>
          <option value="">{relatedType ? "— Sélectionner —" : "Choisissez d'abord un type"}</option>
          {entityOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Source</Label>
        <Input name="source" placeholder="Assurance bientôt expirée, contrôle dépassé…" />
      </div>
      <div>
        <Label>Preuve attendue</Label>
        <Input name="expected_proof" placeholder="Attestation, PV, photo…" />
      </div>

      <div>
        <Label>Assigné à</Label>
        <Select name="assigned_to" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{profileLabel(p)}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label>Superviseur</Label>
        <Select name="supervisor_id" defaultValue="">
          <option value="">Non assigné</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{profileLabel(p)}</option>
          ))}
        </Select>
      </div>

      <div className="sm:col-span-2">
        <Label>Obligation liée</Label>
        <Select name="obligation_id" defaultValue="">
          <option value="">Aucune</option>
          {obligations.map((o) => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Textarea name="description" />
      </div>
      <div className="sm:col-span-2">
        <SubmitButton>Enregistrer l&apos;action</SubmitButton>
      </div>
    </form>
  );
}
