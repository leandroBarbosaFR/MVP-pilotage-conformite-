"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { removeCorrectiveAction } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";

export function RemoveCorrectiveActionButton({ ncId }: { ncId: string }) {
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
          title: "Retirer l'action corrective",
          message: "L'action ne sera pas supprimée, seul le lien avec cette non-conformité est retiré.",
          confirmLabel: "Retirer",
        });
        if (!ok) return;
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
