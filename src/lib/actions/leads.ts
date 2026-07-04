"use server";

import { createClient } from "@/lib/supabase/server";

export type LeadResult = { ok: boolean; error?: string };

export async function submitPilotLead(
  _prev: LeadResult | null,
  formData: FormData
): Promise<LeadResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name || !email) {
    return { ok: false, error: "Le nom et l'email professionnel sont requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pilot_leads").insert({
    name,
    email,
    company: String(formData.get("company") ?? "").trim() || null,
    sector: String(formData.get("sector") ?? "").trim() || null,
    employee_count: String(formData.get("employee_count") ?? "").trim() || null,
    message: String(formData.get("message") ?? "").trim() || null,
  });

  if (error) return { ok: false, error: "Envoi impossible. Réessayez plus tard." };
  return { ok: true };
}
