"use client";

import { useState, useTransition } from "react";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react/dist/ssr";
import { generateNotificationsForDueItems } from "@/lib/actions/notifications";

export function UpdateAlertsButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMessage(null);
            try {
              setMessage(await generateNotificationsForDueItems());
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "Une erreur est survenue.");
            }
          })
        }
        className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
      >
        <ArrowsClockwiseIcon size={16} className={pending ? "animate-spin" : "text-accent"} />
        {pending ? "Mise à jour…" : "Mettre à jour les alertes"}
      </button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}
