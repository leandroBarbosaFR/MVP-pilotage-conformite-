import { createBrowserClient } from "@supabase/ssr";
import { DEMO_COOKIE, resolveDemoMode } from "@/lib/demo";
import { createMockClient } from "@/lib/mock/client";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

/** Client Supabase côté navigateur (composants "use client"). */
export function createClient() {
  if (resolveDemoMode(readCookie(DEMO_COOKIE))) {
    return createMockClient() as unknown as ReturnType<typeof createBrowserClient>;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
