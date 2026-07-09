import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  if (auth.user.role === "ENGINEER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { managerId: true, creatorId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Admin can delete any, manager can delete their own
  if (auth.user.role === "MANAGER" && project.managerId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete connections first, then project
  await prisma.projectConnection.deleteMany({
    where: {
      OR: [{ fromProjectId: params.id }, { toProjectId: params.id }],
    },
  });

  await prisma.project.delete({ where: { id: params.id } });

  return ok({ success: true });
}
