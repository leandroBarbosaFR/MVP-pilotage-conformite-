"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthResult = { error?: string };

export async function signIn(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/dashboard");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Identifiants invalides." };

  redirect(redirectTo || "/dashboard");
}

export async function signUp(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: String(formData.get("first_name") ?? "").trim(),
        last_name: String(formData.get("last_name") ?? "").trim(),
        company_name: String(formData.get("company_name") ?? "").trim(),
        sector: String(formData.get("sector") ?? "").trim(),
        employee_count: String(formData.get("employee_count") ?? "").trim(),
      },
    },
  });

  if (error) return { error: error.message };

  // Si la confirmation par email est désactivée, une session est créée immédiatement.
  if (data.session) redirect("/dashboard");
  redirect("/login?confirm=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
