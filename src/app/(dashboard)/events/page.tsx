import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManage } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewEventButton } from "@/components/events/new-event-button";
import { formatDate } from "@/lib/utils";
import {
  eventStatusColors,
  phaseLabels,
} from "@/lib/labels";
import { MapPin, ListChecks, Users, CalendarRange } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const events = await prisma.event.findMany({
    include: {
      _count: { select: { venues: true, tasks: true, assignments: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Events"
        description="Sporting events and their operational lifecycle."
        action={canManage(user.role) ? <NewEventButton /> : undefined}
      />

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No events yet. Create your first event to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {events.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{e.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {e.location}, {e.country}
                      </p>
                    </div>
                    <Badge color={eventStatusColors[e.status]}>
                      {e.status}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarRange className="h-4 w-4" />
                    {formatDate(e.startDate)} – {formatDate(e.endDate)}
                  </div>

                  <div className="mt-3">
                    <Badge color="purple">
                      Current phase: {phaseLabels[e.currentPhase]}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {e._count.venues} venues
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ListChecks className="h-4 w-4" />
                      {e._count.tasks} tasks
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {e._count.assignments} staff
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
