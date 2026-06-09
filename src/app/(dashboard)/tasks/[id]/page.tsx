import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canManage } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskStatusControl } from "@/components/tasks/task-status-control";
import { CommentBox } from "@/components/tasks/comment-box";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import {
  taskStatusColors,
  taskStatusLabels,
  taskPriorityColors,
  taskPriorityLabels,
  phaseLabels,
  lifecycleLabels,
  lifecycleColors,
} from "@/lib/labels";
import {
  type TaskStatus,
  type TaskPriority,
  type PhaseName,
  type LifecycleStage,
} from "@prisma/client";
import { Link2, CornerDownRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      event: { select: { id: true, name: true } },
      phase: { select: { id: true, name: true } },
      venue: { select: { id: true, name: true } },
      parentTask: { select: { id: true, title: true } },
      subtasks: {
        select: {
          id: true,
          title: true,
          status: true,
          assignee: { select: { name: true } },
        },
      },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      dependencies: {
        include: {
          dependsOn: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  if (!task) notFound();

  const canEdit =
    canManage(user.role) || task.assignee?.id === user.id;

  return (
    <div>
      <PageHeader
        title={task.title}
        description={
          <Link href={`/events/${task.event.id}`}>{task.event.name}</Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {task.parentTask && (
                <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CornerDownRight className="h-4 w-4" />
                  Subtask of{" "}
                  <Link
                    href={`/tasks/${task.parentTask.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {task.parentTask.title}
                  </Link>
                </p>
              )}
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {task.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subtasks ({task.subtasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {task.subtasks.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No subtasks.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {task.subtasks.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/tasks/${s.id}`}
                        className="flex items-center justify-between py-2.5 hover:bg-secondary/40"
                      >
                        <span className="text-sm">{s.title}</span>
                        <Badge color={taskStatusColors[s.status as TaskStatus]}>
                          {taskStatusLabels[s.status as TaskStatus]}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              {task.dependencies.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No dependencies.
                </p>
              ) : (
                <ul className="space-y-2">
                  {task.dependencies.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-2 rounded-md border border-border p-2.5"
                    >
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {d.type.replace(/_/g, " ").toLowerCase()}
                      </span>
                      <Link
                        href={`/tasks/${d.dependsOn.id}`}
                        className="flex-1 text-sm font-medium hover:underline"
                      >
                        {d.dependsOn.title}
                      </Link>
                      <Badge
                        color={
                          taskStatusColors[d.dependsOn.status as TaskStatus]
                        }
                      >
                        {taskStatusLabels[d.dependsOn.status as TaskStatus]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments ({task.comments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    {getInitials(c.author.name)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {c.author.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
              <CommentBox taskId={task.id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskStatusControl
                taskId={task.id}
                status={task.status}
                progress={task.progress}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Status">
                <Badge color={taskStatusColors[task.status as TaskStatus]}>
                  {taskStatusLabels[task.status as TaskStatus]}
                </Badge>
              </DetailRow>
              <DetailRow label="Priority">
                <Badge
                  color={taskPriorityColors[task.priority as TaskPriority]}
                >
                  {taskPriorityLabels[task.priority as TaskPriority]}
                </Badge>
              </DetailRow>
              <DetailRow label="Lifecycle stage">
                <Badge
                  color={
                    lifecycleColors[task.lifecycleStage as LifecycleStage]
                  }
                >
                  {lifecycleLabels[task.lifecycleStage as LifecycleStage]}
                </Badge>
              </DetailRow>
              <DetailRow label="Assignee">
                {task.assignee ? (
                  <Link
                    href={`/staff/${task.assignee.id}`}
                    className="hover:underline"
                  >
                    {task.assignee.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </DetailRow>
              <DetailRow label="Phase">
                {task.phase ? phaseLabels[task.phase.name as PhaseName] : "—"}
              </DetailRow>
              <DetailRow label="Venue">{task.venue?.name ?? "—"}</DetailRow>
              <DetailRow label="Start">{formatDate(task.startDate)}</DetailRow>
              <DetailRow label="Due">{formatDate(task.dueDate)}</DetailRow>
              <DetailRow label="Created by">{task.creator.name}</DetailRow>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
