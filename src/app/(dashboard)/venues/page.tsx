import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManage } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewVenueButton } from "@/components/venues/new-venue-button";
import { venueStatusColors, venueStatusLabels } from "@/lib/labels";
import { MapPin, Users as UsersIcon, ListChecks } from "lucide-react";
import { type VenueType } from "@prisma/client";

export const dynamic = "force-dynamic";

const venueTypeLabels: Record<VenueType, string> = {
  STADIUM: "Stadium",
  ARENA: "Arena",
  AQUATICS_CENTER: "Aquatics Center",
  INDOOR_HALL: "Indoor Hall",
  OUTDOOR_FIELD: "Outdoor Field",
  TRAINING_FACILITY: "Training Facility",
  OPERATIONS_CENTER: "Operations Center",
  ACCOMMODATION: "Accommodation",
  OTHER: "Other",
};

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: { eventId?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const [venues, events] = await Promise.all([
    prisma.venue.findMany({
      where: searchParams.eventId ? { eventId: searchParams.eventId } : {},
      include: {
        event: { select: { name: true } },
        _count: { select: { tasks: true, assignments: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.event.findMany({
      select: { id: true, name: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Venues"
        description="Competition and operational venues across events."
        action={
          canManage(user.role) ? (
            <NewVenueButton
              events={events}
              defaultEventId={searchParams.eventId}
            />
          ) : undefined
        }
      />

      {venues.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No venues yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <Card key={v.id} className="h-full">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{v.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {v.location}
                    </p>
                  </div>
                  <Badge color={venueStatusColors[v.status]}>
                    {venueStatusLabels[v.status]}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge color="blue">{venueTypeLabels[v.type]}</Badge>
                  {v.capacity && (
                    <Badge color="gray">
                      {v.capacity.toLocaleString()} capacity
                    </Badge>
                  )}
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  {v.event.name}
                </p>

                <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ListChecks className="h-3.5 w-3.5" />
                    {v._count.tasks} tasks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UsersIcon className="h-3.5 w-3.5" />
                    {v._count.assignments} staff
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
