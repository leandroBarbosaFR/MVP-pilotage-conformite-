"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleArchive } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

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
  const { toast } = useToast();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        const msg = archived
          ? "Restaurer cet élément ? Il réapparaîtra dans les listes actives."
          : "Archiver cet élément ? Il sera retiré des listes actives (aucune suppression définitive) et restera consultable dans les archives.";
        if (!confirm(msg)) return;
        start(async () => {
          await toggleArchive(table, id, !archived);
          router.refresh();
          toast(archived ? "Élément restauré" : "Élément archivé");
        });
      }}
    >
      {archived ? "Restaurer" : "Archiver"}
    </Button>
  );
}
