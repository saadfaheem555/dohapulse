import { prisma } from "@/lib/prisma";
import { type Role } from "@prisma/client";

export type DashboardStats = {
  totalStaff: number;
  activeEvents: number;
  totalVenues: number;
  openTasks: number;
  completedTasks: number;
  blockedTasks: number;
  myOpenTasks: number;
  upcomingDeadlines: {
    id: string;
    title: string;
    dueDate: Date | null;
    status: string;
    priority: string;
    eventName: string;
  }[];
  tasksByStatus: { status: string; count: number }[];
};

export async function getDashboardStats(
  userId: string,
  _role: Role
): Promise<DashboardStats> {
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);

  const [
    totalStaff,
    activeEvents,
    totalVenues,
    openTasks,
    completedTasks,
    blockedTasks,
    myOpenTasks,
    upcoming,
    grouped,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.event.count({ where: { status: { in: ["PLANNING", "ACTIVE"] } } }),
    prisma.venue.count(),
    prisma.task.count({ where: { status: { not: "DONE" } } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.task.count({ where: { status: "BLOCKED" } }),
    prisma.task.count({
      where: { assigneeId: userId, status: { not: "DONE" } },
    }),
    prisma.task.findMany({
      where: {
        status: { not: "DONE" },
        dueDate: { lte: in7Days, gte: new Date() },
      },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: { event: { select: { name: true } } },
    }),
    prisma.task.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return {
    totalStaff,
    activeEvents,
    totalVenues,
    openTasks,
    completedTasks,
    blockedTasks,
    myOpenTasks,
    upcomingDeadlines: upcoming.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      status: t.status,
      priority: t.priority,
      eventName: t.event.name,
    })),
    tasksByStatus: grouped.map((g) => ({
      status: g.status,
      count: g._count._all,
    })),
  };
}
