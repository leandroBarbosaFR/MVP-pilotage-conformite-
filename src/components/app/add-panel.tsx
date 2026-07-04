"use client";

import { useState } from "react";
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

/** Panneau d'ajout repliable : bouton "Ajouter" qui révèle un formulaire. */
export function AddPanel({
  label = "Ajouter",
  title,
  children,
}: {
  label?: string;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button size="sm" onClick={() => setOpen((v) => !v)}>
        <Plus size={16} /> {label}
      </Button>
      {open ? (
        <div className="mt-3 border border-border bg-background p-4">
          <h3 className="mb-3 text-sm font-semibold">{title}</h3>
          {children}
        </div>
      ) : null}
    </div>
  );
}
