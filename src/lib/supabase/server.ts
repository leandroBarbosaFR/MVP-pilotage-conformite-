import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DEMO_MODE } from "@/lib/demo";
import { createMockClient } from "@/lib/mock/client";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Client Supabase côté serveur (RSC, Server Actions, Route Handlers).
 * Lit/écrit la session via les cookies Next.js.
 * En mode démo, renvoie un client simulé (données en mémoire).
 */
export async function createClient() {
  if (DEMO_MODE) return createMockClient() as unknown as ReturnType<typeof createServerClient>;
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : ignoré, le middleware rafraîchit la session.
          }
        },
      },
    }
  );
}
