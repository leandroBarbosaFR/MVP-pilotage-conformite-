import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Company, Profile } from "@/lib/types/database";

/**
 * Profil + entreprise de l'utilisateur courant.
 * `cache()` évite les appels répétés depuis plusieurs composants d'un même rendu.
 */
export const getCurrentContext = cache(async (): Promise<{
  profile: Profile;
  company: Company;
} | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!profile) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single();
  if (!company) return null;

  return { profile: profile as Profile, company: company as Company };
});

/** À utiliser dans les pages protégées : redirige vers /login si non authentifié. */
export async function requireContext() {
  const ctx = await getCurrentContext();
  if (!ctx) redirect("/login");
  return ctx;
}
