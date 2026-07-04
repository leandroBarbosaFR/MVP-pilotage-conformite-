"use client";
import { useTransition } from "react";
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr";
import { createCorrectiveAction } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";

export function CreateCorrectiveActionButton({ ncId }: { ncId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => start(() => createCorrectiveAction(ncId))}
    >
      <Plus size={14} />
      {pending ? "Création…" : "Action corrective"}
    </Button>
  );
}
