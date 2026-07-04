"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireContext } from "@/lib/queries/auth";
import { canManageUsers } from "@/lib/permissions";

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
