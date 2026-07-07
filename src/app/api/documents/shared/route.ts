import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { canManage } from "@/lib/session";
import { NextResponse } from "next/server";

// GET — Documents shared with the current manager
export async function GET() {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  if (!canManage(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const shares = await prisma.documentShare.findMany({
    where: { sharedWithId: auth.user.id },
    include: {
      document: {
        include: {
          uploadedBy: { select: { id: true, name: true, department: true } },
          event: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
        },
      },
      sharedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(shares);
}
