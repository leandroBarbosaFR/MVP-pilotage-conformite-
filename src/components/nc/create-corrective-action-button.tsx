"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr";
import { createCorrectiveAction } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CreateCorrectiveActionButton({ ncId }: { ncId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await createCorrectiveAction(ncId);
          router.refresh();
          toast("Action corrective créée et associée");
        })
      }
    >
      <Plus size={14} />
      {pending ? "Création…" : "Action corrective"}
    </Button>
  );
}
