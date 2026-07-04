"use client";

import { useState } from "react";
import { LinkSimpleIcon, ListChecksIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

/**
 * Actions documentaires (interface uniquement pour le moment) :
 * associer à une entité, créer une action, analyser avec l'IA.
 */
export function DocumentAiActions() {
  const [message, setMessage] = useState<string | null>(null);
  const soon = (label: string) => setMessage(`${label} — bientôt disponible.`);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => soon("Associer à une entité")}>
          <LinkSimpleIcon size={16} /> Associer à une entité
        </Button>
        <Button variant="outline" size="sm" onClick={() => soon("Créer une action")}>
          <ListChecksIcon size={16} /> Créer une action
        </Button>
        <Button variant="outline" size="sm" onClick={() => soon("Analyse IA")}>
          <SparkleIcon size={16} className="text-accent" /> Analyser avec l&apos;IA
        </Button>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
