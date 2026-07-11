"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEMO_ALLOWED, DEMO_COOKIE } from "@/lib/demo";

/**
 * Bascule démo/live à chaud via un cookie. Sans effet en production (le mode
 * démo y est toujours interdit — voir `DEMO_ALLOWED`). `httpOnly: false` pour
 * que le client Supabase navigateur puisse lire la valeur.
 */
export async function setDemoMode(enabled: boolean) {
  if (!DEMO_ALLOWED) return;
  const store = await cookies();
  store.set(DEMO_COOKIE, enabled ? "1" : "0", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/dashboard", "layout");
}
