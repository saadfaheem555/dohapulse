import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManage } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { TasksView } from "@/components/tasks/tasks-view";
import { type Prisma } from "@prisma/client";
import { type TaskListItem } from "@/components/tasks/types";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { eventId?: string; status?: string; assigneeId?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  // Engineer scoping: only see tasks for assigned events or directly assigned tasks
  let engineerScope: Prisma.TaskWhereInput = {};
  let eventFilter: Prisma.EventWhereInput = {};
  if (user.role === "ENGINEER") {
    const assignedEventIds = (
      await prisma.staffAssignment.findMany({
        where: { userId: user.id },
        select: { eventId: true },
      })
    ).map((a) => a.eventId);
    engineerScope = {
      OR: [
        { eventId: { in: assignedEventIds } },
        { assigneeId: user.id },
      ],
    };
    eventFilter = { id: { in: assignedEventIds } };
  }

  const where: Prisma.TaskWhereInput = {
    AND: [
      engineerScope,
      searchParams.eventId ? { eventId: searchParams.eventId } : {},
      searchParams.status ? { status: searchParams.status as never } : {},
      searchParams.assigneeId ? { assigneeId: searchParams.assigneeId } : {},
    ],
  };

  const [rawTasks, events, staff] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } },
        event: { select: { name: true } },
        phase: { select: { name: true } },
        venue: { select: { name: true } },
        _count: { select: { subtasks: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.event.findMany({
      where: eventFilter,
      select: {
        id: true,
        name: true,
        phases: { select: { id: true, name: true } },
        venues: { select: { id: true, name: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const tasks: TaskListItem[] = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    progress: t.progress,
    startDate: t.startDate?.toISOString() ?? null,
    dueDate: t.dueDate?.toISOString() ?? null,
    assignee: t.assignee,
    event: t.event,
    phase: t.phase,
    venue: t.venue,
    subtaskCount: t._count.subtasks,
  }));

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Operational tasks across the full event journey — plan, assign, and track."
      />
      <Suspense fallback={null}>
        <TasksView
          tasks={tasks}
          events={events}
          staff={staff}
          canManage={canManage(user.role)}
        />
      </Suspense>
    </div>
  );
}
