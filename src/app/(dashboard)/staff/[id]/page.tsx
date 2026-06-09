import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInitials, formatDate } from "@/lib/utils";
import {
  roleLabels,
  roleColors,
  taskStatusColors,
  taskStatusLabels,
} from "@/lib/labels";
import { type TaskStatus } from "@prisma/client";
import { Mail, Phone, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StaffDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const staff = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      assignments: {
        include: {
          event: { select: { name: true } },
          venue: { select: { name: true } },
        },
        orderBy: { startDate: "desc" },
      },
      assignedTasks: {
        include: { event: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
        take: 50,
      },
    },
  });

  if (!staff) notFound();

  return (
    <div>
      <PageHeader
        title={staff.name}
        description={staff.specialization ?? "Staff member"}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-foreground">
                {getInitials(staff.name)}
              </div>
              <h2 className="mt-4 text-lg font-semibold">{staff.name}</h2>
              <Badge color={roleColors[staff.role]} className="mt-2">
                {roleLabels[staff.role]}
              </Badge>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {staff.email}
              </div>
              {staff.phone && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {staff.phone}
                </div>
              )}
              {staff.department && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {staff.department}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
            </CardHeader>
            <CardContent>
              {staff.assignments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No event assignments yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {staff.assignments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{a.role}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.event.name}
                          {a.venue ? ` · ${a.venue.name}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(a.startDate)} –{" "}
                        {a.endDate ? formatDate(a.endDate) : "ongoing"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {staff.assignedTasks.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No tasks assigned.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {staff.assignedTasks.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/tasks/${t.id}`}
                        className="flex items-center justify-between py-3 hover:bg-secondary/40"
                      >
                        <div>
                          <p className="text-sm font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.event.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            color={taskStatusColors[t.status as TaskStatus]}
                          >
                            {taskStatusLabels[t.status as TaskStatus]}
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
        </div>
      </div>
    </div>
  );
}
