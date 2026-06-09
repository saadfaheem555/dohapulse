import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhaseTimeline } from "@/components/events/phase-timeline";
import { formatDate } from "@/lib/utils";
import {
  eventStatusColors,
  venueStatusColors,
  venueStatusLabels,
  taskStatusColors,
  taskStatusLabels,
} from "@/lib/labels";
import { MapPin, ListChecks, Users, CalendarRange } from "lucide-react";
import { type TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      phases: true,
      venues: { orderBy: { name: "asc" } },
      assignments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { startDate: "desc" },
        take: 10,
      },
      tasks: {
        orderBy: { dueDate: "asc" },
        take: 8,
        include: { assignee: { select: { name: true } } },
      },
      _count: { select: { tasks: true, venues: true, assignments: true } },
    },
  });

  if (!event) notFound();

  return (
    <div>
      <PageHeader
        title={event.name}
        description={`${event.location}, ${event.country}`}
        action={
          <div className="flex items-center gap-2">
            <Badge color={eventStatusColors[event.status]}>
              {event.status}
            </Badge>
            <Link href={`/tasks?eventId=${event.id}`}>
              <Button variant="outline">View Tasks</Button>
            </Link>
            <Link href={`/venues?eventId=${event.id}`}>
              <Button variant="outline">Venues</Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarRange className="h-4 w-4" />
          {formatDate(event.startDate)} – {formatDate(event.endDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          {event._count.venues} venues
        </span>
        <span className="flex items-center gap-1.5">
          <ListChecks className="h-4 w-4" />
          {event._count.tasks} tasks
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {event._count.assignments} staff assigned
        </span>
      </div>

      {event.description && (
        <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
          {event.description}
        </p>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Event Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <PhaseTimeline
            phases={event.phases}
            currentPhase={event.currentPhase}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Venues</CardTitle>
          </CardHeader>
          <CardContent>
            {event.venues.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No venues added yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {event.venues.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.location}
                        {v.capacity
                          ? ` · ${v.capacity.toLocaleString()} cap.`
                          : ""}
                      </p>
                    </div>
                    <Badge color={venueStatusColors[v.status]}>
                      {venueStatusLabels[v.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {event.tasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No tasks yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {event.tasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/tasks/${t.id}`}
                      className="flex items-center justify-between py-3 hover:bg-secondary/40"
                    >
                      <div>
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.assignee?.name ?? "Unassigned"}
                        </p>
                      </div>
                      <Badge color={taskStatusColors[t.status as TaskStatus]}>
                        {taskStatusLabels[t.status as TaskStatus]}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
