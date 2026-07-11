"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireContext } from "@/lib/queries/auth";
import { canManageUsers } from "@/lib/permissions";
import { logActivity } from "@/lib/actions/activity";

/** Modifier le rôle d'un membre du tenant (ADMIN uniquement). */
export async function updateUserRole(profileId: string, role: string) {
  const { profile, company } = await requireContext();
  if (!canManageUsers(profile.role)) throw new Error("Action non autorisée");
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId)
    .eq("company_id", company.id);
  revalidatePath("/dashboard/settings");
}

/** Activer / désactiver un membre (ADMIN uniquement). */
export async function setUserActive(profileId: string, isActive: boolean) {
  const { profile, company } = await requireContext();
  if (!canManageUsers(profile.role)) throw new Error("Action non autorisée");
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId)
    .eq("company_id", company.id);
  revalidatePath("/dashboard/settings");
}

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

/** Modifier les informations de l'entreprise (ADMIN uniquement). */
export async function updateCompany(formData: FormData) {
  const { profile, company } = await requireContext();
  if (!canManageUsers(profile.role)) throw new Error("Action non autorisée");
  const supabase = await createClient();
  await supabase
    .from("companies")
    .update({
      name: str(formData.get("name")) ?? company.name,
      sector: str(formData.get("sector")),
      employee_count: str(formData.get("employee_count")),
      address: str(formData.get("address")),
      city: str(formData.get("city")),
      country: str(formData.get("country")),
      contact_email: str(formData.get("contact_email")),
      contact_phone: str(formData.get("contact_phone")),
    })
    .eq("id", company.id);
  await logActivity(supabase, company.id, profile.id, {
    actionType: "SETTINGS_UPDATE",
    entityType: "companies",
    entityId: company.id,
    label: "Informations entreprise",
  });
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard", "layout");
}

/** Enregistrer les réglages de notifications du tenant. */
export async function saveNotificationSettings(formData: FormData) {
  const { profile, company } = await requireContext();
  const allowed = canManageUsers(profile.role) || profile.role === "QHSE_MANAGER";
  if (!allowed) throw new Error("Action non autorisée");
  const supabase = await createClient();
  const days = Number(formData.get("alert_days_before_due"));
  await supabase.from("notification_settings").upsert(
    {
      tenant_id: company.id,
      alert_days_before_due: Number.isFinite(days) && days > 0 ? Math.round(days) : 30,
      notify_responsible: formData.get("notify_responsible") === "on",
      notify_supervisor: formData.get("notify_supervisor") === "on",
      notify_admin: formData.get("notify_admin") === "on",
      email_enabled: false, // désactivé pour le MVP
    },
    { onConflict: "tenant_id" }
  );
  revalidatePath("/dashboard/settings");
}
