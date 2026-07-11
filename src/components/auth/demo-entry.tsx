"use client";

import { useTransition } from "react";
import { FlaskIcon } from "@phosphor-icons/react/dist/ssr";
import { setDemoMode } from "@/lib/actions/demo";

/**
 * Entrée publique vers la démo (page de connexion) : active le mode démo puis
 * ouvre le tableau de bord avec des données fictives, sans identifiants. Pratique
 * pour présenter l'app à un client. Le rendu est conditionné à `DEMO_ALLOWED`
 * côté page.
 */
export function DemoEntry() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setDemoMode(true);
          window.location.href = "/dashboard";
        })
      }
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
    >
      <FlaskIcon size={16} className="text-status-warn" />
      {pending ? "Ouverture…" : "Voir la démo (données fictives)"}
    </button>
  );
}
