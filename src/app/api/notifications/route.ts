import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { NextRequest } from "next/server";

export async function GET() {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const notifications = await prisma.notification.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return ok(notifications);
}

// Mark notifications as read. Body: { id } to mark one, or { all: true }.
export async function PATCH(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const body = await req.json().catch(() => ({}));

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, read: false },
      data: { read: true },
    });
  } else if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: auth.user.id },
      data: { read: true },
    });
  }

  return ok({ success: true });
}
