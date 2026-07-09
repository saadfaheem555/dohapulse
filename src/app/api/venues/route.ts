import { prisma } from "@/lib/prisma";
import { withAuth, requireManager, badRequest, ok } from "@/lib/api";
import { createVenueSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  // Non-admins only see venues for their assigned events
  let eventFilter: { eventId?: string | { in: string[] } } = {};
  if (eventId) {
    eventFilter = { eventId };
  } else if (auth.user.role !== "ADMIN") {
    const assignedEventIds = await prisma.staffAssignment.findMany({
      where: { userId: auth.user.id },
      select: { eventId: true },
    });
    eventFilter = { eventId: { in: assignedEventIds.map((a) => a.eventId) } };
  }

  const venues = await prisma.venue.findMany({
    where: eventFilter,
    include: {
      event: { select: { name: true } },
      _count: { select: { tasks: true, assignments: true } },
    },
    orderBy: { name: "asc" },
  });

  return ok(venues);
}

export async function POST(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const forbidden = requireManager(auth.user);
  if (forbidden) return forbidden;

  const body = await req.json();
  const parsed = createVenueSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const data = parsed.data;
  const venue = await prisma.venue.create({
    data: {
      eventId: data.eventId,
      name: data.name,
      location: data.location,
      capacity: data.capacity ?? null,
      type: data.type,
      status: data.status,
      description: data.description ?? null,
    },
  });

  return ok(venue, 201);
}
