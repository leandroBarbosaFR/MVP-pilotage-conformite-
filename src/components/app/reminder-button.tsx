"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRingingIcon } from "@phosphor-icons/react/dist/ssr";
import { createReminder } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";

export function ReminderButton({
  label,
  providerId,
  relatedType,
  relatedId,
  responsibleId,
}: {
  label: string;
  providerId?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  responsibleId?: string | null;
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
          await createReminder({ label, providerId, relatedType, relatedId, responsibleId });
          router.refresh();
        })
      }
    >
      <BellRingingIcon size={14} />
      {pending ? "Relance…" : "Relancer"}
    </Button>
  );
}
