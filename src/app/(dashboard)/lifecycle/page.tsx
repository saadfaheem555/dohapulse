import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManage } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EventSelect } from "@/components/events/event-select";
import {
  LIFECYCLE_ORDER,
  lifecycleLabels,
  lifecycleDescriptions,
  lifecycleColors,
  taskStatusColors,
  taskStatusLabels,
} from "@/lib/labels";
import {
  type LifecycleStage,
  type TaskStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_ORDER: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "REVIEW",
  "DONE",
];

export default async function LifecyclePage({
  searchParams,
}: {
  searchParams: { eventId?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  // Management-only tracking view.
  if (!canManage(user.role)) {
    redirect("/");
  }

  const events = await prisma.event.findMany({
    select: { id: true, name: true },
    orderBy: { startDate: "asc" },
  });

  if (events.length === 0) {
    return (
      <div>
        <PageHeader
          title="Lifecycle Tracking"
          description="Project management lifecycle status across all tasks."
        />
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No events yet. Create an event to begin lifecycle tracking.
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventId = searchParams.eventId ?? events[0].id;

  const tasks = await prisma.task.findMany({
    where: { eventId },
    select: {
      id: true,
      title: true,
      status: true,
      lifecycleStage: true,
      assignee: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Aggregate counts per stage + status.
  const byStage = (stage: LifecycleStage) =>
    tasks.filter((t) => t.lifecycleStage === stage);

  const statusCount = (
    list: typeof tasks,
    status: TaskStatus
  ): number => list.filter((t) => t.status === status).length;

  // Overall lifecycle progress (done / total).
  const total = tasks.length;
  const doneTotal = tasks.filter((t) => t.status === "DONE").length;
  const overall = total === 0 ? 0 : Math.round((doneTotal / total) * 100);

  return (
    <div>
      <PageHeader
        title="Lifecycle Tracking"
        description="All project tasks tracked by PMBOK lifecycle stage and status — including not started and in progress."
        action={
          <EventSelect
            events={events}
            selected={eventId}
            basePath="/lifecycle"
          />
        }
      />

      {/* Overall summary */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Overall lifecycle completion
              </p>
              <p className="text-3xl font-bold">{overall}%</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {STATUS_ORDER.map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <Badge color={taskStatusColors[s]}>
                    {taskStatusLabels[s]}
                  </Badge>
                  <span className="text-lg font-semibold">
                    {statusCount(tasks, s)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={overall} color={overall === 100 ? "green" : "primary"} />
          </div>
        </CardContent>
      </Card>

      {/* Stage board */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {LIFECYCLE_ORDER.map((stage) => {
          const list = byStage(stage);
          const done = statusCount(list, "DONE");
          const progress =
            list.length === 0 ? 0 : Math.round((done / list.length) * 100);

          return (
            <div
              key={stage}
              className="flex flex-col rounded-lg border border-border bg-card"
            >
              <div className="border-b border-border p-3">
                <div className="flex items-center justify-between">
                  <Badge color={lifecycleColors[stage]}>
                    {lifecycleLabels[stage]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {list.length}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                  {lifecycleDescriptions[stage]}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar
                    value={progress}
                    color={progress === 100 ? "green" : "primary"}
                  />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {progress}%
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2 p-2">
                {list.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                    No tasks
                  </p>
                ) : (
                  list.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tasks/${t.id}`}
                      className="block rounded-md border border-border p-2.5 transition-colors hover:bg-secondary/40"
                    >
                      <p className="text-sm font-medium leading-snug">
                        {t.title}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <Badge
                          color={taskStatusColors[t.status as TaskStatus]}
                        >
                          {taskStatusLabels[t.status as TaskStatus]}
                        </Badge>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {t.assignee?.name ?? "Unassigned"}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
