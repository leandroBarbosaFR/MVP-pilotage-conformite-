"use client";

import { useTransition } from "react";
import { toggleArchive } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";

export function ArchiveButton({
  table,
  id,
  archived,
}: {
  table: string;
  id: string;
  archived: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => start(() => toggleArchive(table, id, !archived))}
    >
      {archived ? "Restaurer" : "Archiver"}
    </Button>
  );
}
