"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleArchive } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";

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
  const confirm = useConfirm();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={async () => {
        const ok = await confirm({
          title: archived ? "Restaurer l'élément" : "Archiver l'élément",
          message: archived
            ? "Il réapparaîtra dans les listes actives."
            : "Il sera retiré des listes actives (aucune suppression définitive) et restera consultable dans les archives.",
          confirmLabel: archived ? "Restaurer" : "Archiver",
        });
        if (!ok) return;
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
