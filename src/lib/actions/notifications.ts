"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireContext } from "@/lib/queries/auth";
import { canManageUsers } from "@/lib/permissions";

type NewNotification = {
  company_id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  related_entity_type: string;
  related_entity_id: string;
  is_read: boolean;
};

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

function fmt(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Génère les notifications internes pour les éléments à échéance proche ou dépassée.
 * Notifie le responsable et le superviseur (selon les réglages du tenant),
 * en évitant les doublons (même élément + même type + même destinataire).
 */
export async function generateNotificationsForDueItems() {
  const { profile, company } = await requireContext();
  if (!(canManageUsers(profile.role) || profile.role === "QHSE_MANAGER")) {
    throw new Error("Action non autorisée");
  }
  const supabase = await createClient();
  const cid = company.id;

  // Réglages
  const { data: settingsRow } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("tenant_id", cid)
    .maybeSingle();
  const threshold = settingsRow?.alert_days_before_due ?? 30;
  const notifyResponsible = settingsRow?.notify_responsible ?? true;
  const notifySupervisor = settingsRow?.notify_supervisor ?? true;
  const notifyAdmin = settingsRow?.notify_admin ?? false;

  // Destinataires "admin" éventuels
  let adminIds: string[] = [];
  if (notifyAdmin) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("company_id", cid)
      .eq("role", "ADMIN")
      .eq("is_active", true);
    adminIds = (data ?? []).map((r) => r.id as string);
  }

  const [obligations, actions, documents, epis] = await Promise.all([
    supabase.from("obligations").select("id, title, due_date, responsible_id, supervisor_id").eq("company_id", cid).eq("is_archived", false),
    supabase.from("actions").select("id, title, due_date, status, assigned_to, supervisor_id").eq("company_id", cid).eq("is_archived", false),
    supabase.from("documents").select("id, title, expiration_date, responsible_id, supervisor_id").eq("company_id", cid).eq("is_archived", false),
    supabase.from("epi").select("id, epi_type, internal_reference, renewal_date, responsible_id, supervisor_id").eq("company_id", cid).eq("is_archived", false),
  ]);

  // Notifications déjà présentes : clé élément|type|destinataire (évite les doublons)
  const { data: existing } = await supabase
    .from("notifications")
    .select("related_entity_id, type, user_id")
    .eq("company_id", cid)
    .not("related_entity_id", "is", null);
  const seen = new Set(
    (existing ?? []).map((n) => `${n.related_entity_id}|${n.type}|${n.user_id}`)
  );

  const pending: NewNotification[] = [];

  const recipientsFor = (responsible: string | null, supervisor: string | null): { id: string; role: "responsible" | "supervisor" | "admin" }[] => {
    const list: { id: string; role: "responsible" | "supervisor" | "admin" }[] = [];
    if (notifyResponsible && responsible) list.push({ id: responsible, role: "responsible" });
    if (notifySupervisor && supervisor) list.push({ id: supervisor, role: "supervisor" });
    for (const a of adminIds) list.push({ id: a, role: "admin" });
    return list;
  };

  const push = (
    entityType: string,
    entityId: string,
    responsible: string | null,
    supervisor: string | null,
    type: string,
    priority: string,
    title: string,
    message: string
  ) => {
    for (const r of recipientsFor(responsible, supervisor)) {
      const key = `${entityId}|${type}|${r.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pending.push({
        company_id: cid,
        user_id: r.id,
        title,
        message,
        type,
        priority,
        related_entity_type: entityType,
        related_entity_id: entityId,
        is_read: false,
      });
    }
  };

  // Obligations
  for (const o of obligations.data ?? []) {
    const d = daysUntil(o.due_date as string | null);
    if (d === null || d > threshold) continue;
    const expired = d < 0;
    push(
      "obligation", o.id as string, o.responsible_id as string | null, o.supervisor_id as string | null,
      expired ? "EXPIRED" : "DUE_SOON",
      expired ? "CRITICAL" : d < 7 ? "HIGH" : "MEDIUM",
      expired ? "Obligation expirée" : "Échéance proche",
      `L'obligation « ${o.title} » ${expired ? "est dépassée depuis le" : "arrive à échéance le"} ${fmt(o.due_date as string | null)}.`
    );
  }

  // Documents
  for (const doc of documents.data ?? []) {
    const d = daysUntil(doc.expiration_date as string | null);
    if (d === null || d > threshold) continue;
    const expired = d < 0;
    push(
      "document", doc.id as string, doc.responsible_id as string | null, doc.supervisor_id as string | null,
      expired ? "EXPIRED" : "DUE_SOON",
      expired ? "CRITICAL" : d < 7 ? "HIGH" : "MEDIUM",
      expired ? "Document expiré" : "Document à renouveler",
      `Le document « ${doc.title} » ${expired ? "est expiré depuis le" : "expire le"} ${fmt(doc.expiration_date as string | null)}.`
    );
  }

  // EPI
  for (const e of epis.data ?? []) {
    const d = daysUntil(e.renewal_date as string | null);
    if (d === null || d > threshold) continue;
    const expired = d < 0;
    const ref = e.internal_reference ? ` (${e.internal_reference})` : "";
    push(
      "epi", e.id as string, e.responsible_id as string | null, e.supervisor_id as string | null,
      expired ? "EXPIRED" : "DUE_SOON",
      expired ? "CRITICAL" : d < 7 ? "HIGH" : "MEDIUM",
      expired ? "EPI à renouveler" : "Renouvellement EPI proche",
      `Le renouvellement de l'EPI ${e.epi_type}${ref} ${expired ? "est dépassé depuis le" : "est à prévoir avant le"} ${fmt(e.renewal_date as string | null)}.`
    );
  }

  // Actions en retard (non terminées)
  for (const a of actions.data ?? []) {
    if (a.status === "DONE" || a.status === "CANCELLED" || a.status === "ARCHIVED") continue;
    const d = daysUntil(a.due_date as string | null);
    if (d === null || d >= 0) continue; // uniquement en retard
    push(
      "action", a.id as string, a.assigned_to as string | null, a.supervisor_id as string | null,
      "ACTION_LATE", "HIGH",
      "Action en retard",
      `L'action « ${a.title} » est en retard (échéance ${fmt(a.due_date as string | null)}).`
    );
  }

  let created = 0;
  if (pending.length > 0) {
    const { error } = await supabase.from("notifications").insert(pending);
    if (!error) created = pending.length;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");

  return created === 0
    ? "Aucune nouvelle alerte à générer. Tout est à jour."
    : `${created} notification${created > 1 ? "s" : ""} générée${created > 1 ? "s" : ""}.`;
}
