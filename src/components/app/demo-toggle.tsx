"use client";

import { useTransition } from "react";
import { FlaskIcon, DatabaseIcon } from "@phosphor-icons/react/dist/ssr";
import { setDemoMode } from "@/lib/actions/demo";
import { cn } from "@/lib/utils";

/**
 * Bascule démo ⇄ live (dev uniquement — le parent ne le rend pas en prod).
 * `active` = mode démo courant, résolu côté serveur. Après bascule, on recharge
 * la page pour que tous les clients Supabase repartent sur la bonne source.
 */
export function DemoToggle({ active }: { active: boolean }) {
  const [pending, start] = useTransition();

  const toggle = () =>
    start(async () => {
      await setDemoMode(!active);
      window.location.reload();
    });

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title={active ? "Mode démo (données fictives) — cliquer pour passer en live" : "Mode live (Supabase) — cliquer pour passer en démo"}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors disabled:opacity-50",
        active
          ? "border-status-warn/30 bg-status-warn/10 text-status-warn hover:bg-status-warn/20"
          : "border-status-ok/30 bg-status-ok/10 text-status-ok hover:bg-status-ok/20"
      )}
    >
      {active ? <FlaskIcon size={14} /> : <DatabaseIcon size={14} />}
      {active ? "Démo" : "Live"}
    </button>
  );
}
