import { prisma } from "@/lib/prisma";
import { type NotificationType } from "@prisma/client";

export async function notify(params: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  if (!params.userId) return;
  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "SYSTEM",
      link: params.link ?? null,
    },
  });
}

/**
 * Notify the manager assigned to an engineer.
 * Looks up the engineer's managerId and sends the notification only to them.
 */
export async function notifyManager(
  engineerId: string,
  params: {
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
  }
) {
  const engineer = await prisma.user.findUnique({
    where: { id: engineerId },
    select: { managerId: true },
  });

  if (!engineer?.managerId) return;

  await notify({
    userId: engineer.managerId,
    ...params,
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}
