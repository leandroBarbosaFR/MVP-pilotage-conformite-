"use client";

import { useTransition } from "react";
import { markNotification } from "@/lib/actions/entities";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types/database";

export function NotificationList({ items }: { items: Notification[] }) {
  if (items.length === 0) {
    return (
      <div className="border border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
        Aucune notification.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((n) => (
        <NotificationRow key={n.id} notification={n} />
      ))}
    </div>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const [pending, start] = useTransition();
  const unread = !notification.is_read;

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border border-border bg-background px-4 py-3",
        unread && "border-l-2 border-l-primary"
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-sm text-foreground", unread && "font-semibold")}>
            {notification.title}
          </span>
          {notification.type ? (
            <span className="rounded-sm border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
              {notification.type}
            </span>
          ) : null}
        </div>
        {notification.message ? (
          <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">{formatDate(notification.created_at)}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => start(() => markNotification(notification.id, unread))}
      >
        {unread ? "Marquer lu" : "Marquer non lu"}
      </Button>
    </div>
  );
}
