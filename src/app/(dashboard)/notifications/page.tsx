import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { formatDateTime } from "@/lib/utils";
import {
  Bell,
  ClipboardList,
  Clock,
} from "lucide-react";
import { type NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Task assignments, deadlines, and event updates."
        action={<MarkAllReadButton hasUnread={hasUnread} />}
      />

      <Card className="overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Bell className="mx-auto mb-3 h-8 w-8 opacity-40" />
            You&apos;re all caught up.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const content = (
                <div
                  className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-secondary/40 ${
                    n.read ? "" : "bg-accent/40"
                  }`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <NotificationIcon type={n.type} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              );

              return (
                <li key={n.id}>
                  {n.link ? <Link href={n.link}>{content}</Link> : content}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "TASK_ASSIGNED":
    case "TASK_UPDATED":
      return <ClipboardList className="h-4 w-4" />;
    case "DEADLINE_APPROACHING":
      return <Clock className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}
