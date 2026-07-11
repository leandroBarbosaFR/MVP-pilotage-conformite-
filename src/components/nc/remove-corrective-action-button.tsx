"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { removeCorrectiveAction } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function RemoveCorrectiveActionButton({ ncId }: { ncId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Retirer l'action corrective de cette non-conformité ? L'action ne sera pas supprimée, seul le lien est retiré.")) return;
        start(async () => {
          await removeCorrectiveAction(ncId);
          router.refresh();
          toast("Action corrective retirée de cette non-conformité");
        });
      }}
    >
      <XIcon size={14} />
      {pending ? "Retrait…" : "Retirer l'action"}
    </Button>
  );
}
