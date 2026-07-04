"use client";

import { useState, useTransition } from "react";
import { loadDemoData } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";

export function DemoButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMessage(null);
            try {
              const result = await loadDemoData();
              setMessage(result || "Données de démonstration chargées.");
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "Une erreur est survenue.");
            }
          })
        }
      >
        {pending ? "Chargement…" : "Charger les données de démonstration"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
