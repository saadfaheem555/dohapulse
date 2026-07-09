import { prisma } from "@/lib/prisma";
import { withAuth, requireManager, badRequest, ok } from "@/lib/api";
import { createAssignmentSchema } from "@/lib/validations";
import { notify } from "@/services/notifications";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const userId = searchParams.get("userId");

  const assignments = await prisma.staffAssignment.findMany({
    where: {
      AND: [eventId ? { eventId } : {}, userId ? { userId } : {}],
    },
    include: {
      user: { select: { id: true, name: true } },
      event: { select: { name: true } },
      venue: { select: { name: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return ok(assignments);
}

export async function POST(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const forbidden = requireManager(auth.user);
  if (forbidden) return forbidden;

  const body = await req.json();
  const parsed = createAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const d = parsed.data;

  // Managers can only assign their own engineers to events they are assigned to
  if (auth.user.role === "MANAGER") {
    // Verify the manager is assigned to this event
    const managerAssignment = await prisma.staffAssignment.findFirst({
      where: { userId: auth.user.id, eventId: d.eventId },
    });
    if (!managerAssignment) {
      return badRequest("You can only assign staff to events you are assigned to");
    }

    // Verify the target user is one of their engineers
    const targetUser = await prisma.user.findUnique({
      where: { id: d.userId },
      select: { role: true, managerId: true },
    });
    if (!targetUser || targetUser.role !== "ENGINEER" || targetUser.managerId !== auth.user.id) {
      return badRequest("You can only assign your own engineers");
    }
  }

  const assignment = await prisma.staffAssignment.create({
    data: {
      userId: d.userId,
      eventId: d.eventId,
      venueId: d.venueId || null,
      phaseId: d.phaseId || null,
      role: d.role,
      startDate: new Date(d.startDate),
      endDate: d.endDate ? new Date(d.endDate) : null,
      notes: d.notes ?? null,
    },
  });

  await notify({
    userId: d.userId,
    title: "New event assignment",
    message: `You have been assigned as ${d.role}.`,
    type: "ASSIGNMENT_CREATED",
    link: `/staff/${d.userId}`,
  });

  return ok(assignment, 201);
}
