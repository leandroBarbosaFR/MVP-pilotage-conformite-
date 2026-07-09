"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await toggleArchive(table, id, !archived);
          router.refresh();
        })
      }
    >
      {archived ? "Restaurer" : "Archiver"}
    </Button>
  );
}
