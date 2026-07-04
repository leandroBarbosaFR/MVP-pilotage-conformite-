import { createBrowserClient } from "@supabase/ssr";
import { DEMO_MODE } from "@/lib/demo";
import { createMockClient } from "@/lib/mock/client";

/** Client Supabase côté navigateur (composants "use client"). */
export function createClient() {
  if (DEMO_MODE) return createMockClient() as unknown as ReturnType<typeof createBrowserClient>;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
