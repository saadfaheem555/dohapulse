import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getDashboardStats } from "@/services/dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  taskStatusColors,
  taskStatusLabels,
  taskPriorityColors,
  taskPriorityLabels,
} from "@/lib/labels";
import {
  Users,
  CalendarRange,
  MapPin,
  ListChecks,
  CircleCheckBig,
  TriangleAlert,
} from "lucide-react";
import { type TaskStatus, type TaskPriority } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const stats = await getDashboardStats(user.id, user.role);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name?.split(" ")[0] ?? ""}`}
        description="Operational overview across all events and venues."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Staff"
          value={stats.totalStaff}
          icon={<Users className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          label="Active Events"
          value={stats.activeEvents}
          icon={<CalendarRange className="h-5 w-5" />}
          accent="purple"
        />
        <StatCard
          label="Venues"
          value={stats.totalVenues}
          icon={<MapPin className="h-5 w-5" />}
          accent="green"
        />
        <StatCard
          label="My Open Tasks"
          value={stats.myOpenTasks}
          icon={<ListChecks className="h-5 w-5" />}
          accent="orange"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Open Tasks"
          value={stats.openTasks}
          icon={<ListChecks className="h-5 w-5" />}
          accent="primary"
        />
        <StatCard
          label="Completed"
          value={stats.completedTasks}
          icon={<CircleCheckBig className="h-5 w-5" />}
          accent="green"
        />
        <StatCard
          label="Blocked"
          value={stats.blockedTasks}
          icon={<TriangleAlert className="h-5 w-5" />}
          accent="red"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Deadlines (next 7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingDeadlines.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No tasks due in the next 7 days.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.upcomingDeadlines.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/tasks/${t.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-secondary/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {t.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.eventName}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          color={
                            taskPriorityColors[t.priority as TaskPriority]
                          }
                        >
                          {taskPriorityLabels[t.priority as TaskPriority]}
                        </Badge>
                        <span className="w-20 text-right text-xs text-muted-foreground">
                          {formatDate(t.dueDate)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.tasksByStatus.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No tasks yet.
              </p>
            ) : (
              stats.tasksByStatus.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center justify-between"
                >
                  <Badge color={taskStatusColors[s.status as TaskStatus]}>
                    {taskStatusLabels[s.status as TaskStatus]}
                  </Badge>
                  <span className="text-sm font-semibold">{s.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
