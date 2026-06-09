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

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}
