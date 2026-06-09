import { prisma } from "@/lib/prisma";
import { withAuth, requireAdmin, badRequest, ok } from "@/lib/api";
import { updateUserSchema } from "@/lib/validations";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      specialization: true,
      phone: true,
      status: true,
      createdAt: true,
      assignments: {
        include: {
          event: { select: { name: true } },
          venue: { select: { name: true } },
        },
        orderBy: { startDate: "desc" },
      },
      assignedTasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          event: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 50,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return ok(user);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const forbidden = requireAdmin(auth.user);
  if (forbidden) return forbidden;

  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: parsed.data,
    select: { id: true, name: true, role: true, status: true },
  });

  return ok(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const forbidden = requireAdmin(auth.user);
  if (forbidden) return forbidden;

  // Soft-deactivate rather than hard delete to preserve audit history
  await prisma.user.update({
    where: { id: params.id },
    data: { status: "INACTIVE" },
  });

  return ok({ success: true });
}
