import { prisma } from "@/lib/prisma";
import { withAuth, requireManager, badRequest, ok } from "@/lib/api";
import { createEventSchema } from "@/lib/validations";
import { createEventWithPhases } from "@/services/events";
import { NextRequest } from "next/server";

export async function GET() {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  // Engineers only see events they are assigned to
  let where = {};
  if (auth.user.role === "ENGINEER") {
    const assignedEventIds = await prisma.staffAssignment.findMany({
      where: { userId: auth.user.id },
      select: { eventId: true },
    });
    where = { id: { in: assignedEventIds.map((a) => a.eventId) } };
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      _count: { select: { venues: true, tasks: true, assignments: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return ok(events);
}

export async function POST(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const forbidden = requireManager(auth.user);
  if (forbidden) return forbidden;

  const body = await req.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const data = parsed.data;
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  if (end <= start) {
    return badRequest("End date must be after start date");
  }

  const event = await createEventWithPhases({
    name: data.name,
    description: data.description,
    type: data.type as never,
    location: data.location,
    country: data.country,
    startDate: start,
    endDate: end,
    creatorId: auth.user.id,
  });

  await prisma.auditLog.create({
    data: {
      userId: auth.user.id,
      action: "CREATE",
      entity: "Event",
      entityId: event.id,
      details: `Created event ${event.name} with 7 lifecycle phases`,
    },
  });

  return ok(event, 201);
}
