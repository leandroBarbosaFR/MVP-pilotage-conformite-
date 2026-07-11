"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateReminderStatus } from "@/lib/actions/entities";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { REMINDER_STATUS_LABELS } from "@/types/enums";

export function ReminderStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  return (
    <Select
      value={status}
      disabled={pending}
      className="w-36"
      onChange={(e) =>
        start(async () => {
          await updateReminderStatus(id, e.target.value);
          router.refresh();
          toast("Statut de relance mis à jour");
        })
      }
    >
      {Object.entries(REMINDER_STATUS_LABELS).map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </Select>
  );
}
