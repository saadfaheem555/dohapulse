import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JourneyTimeline } from "@/components/journey/journey-timeline";
import { eventStatusColors } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JourneyPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Admins see all events; managers/engineers only see assigned events
  let where = {};
  if (user.role !== "ADMIN") {
    const assignedEventIds = await prisma.staffAssignment.findMany({
      where: { userId: user.id },
      select: { eventId: true },
    });
    where = { id: { in: assignedEventIds.map((a: { eventId: string }) => a.eventId) } };
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      phases: { orderBy: { order: "asc" } },
      _count: { select: { tasks: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Event Journey"
        description="The complete lifecycle of each event — from bidding through games-time to legacy."
      />

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No events to display yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {events.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{e.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(e.startDate)} – {formatDate(e.endDate)}
                    </span>
                    <Badge color={eventStatusColors[e.status]}>
                      {e.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <JourneyTimeline
                  phases={e.phases}
                  currentPhase={e.currentPhase}
                  eventStart={e.startDate}
                  eventEnd={e.endDate}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
