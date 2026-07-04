import { requireContext } from "@/lib/queries/auth";
import { getNotifications } from "@/lib/queries/entities";
import { markAllNotificationsRead } from "@/lib/actions/entities";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const { profile } = await requireContext();
  const items = await getNotifications(profile.id);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Alertes et rappels de conformité."
        action={
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline" size="sm">
              Tout marquer comme lu
            </Button>
          </form>
        }
      />

      <NotificationList items={items} />
    </div>
  );
}
