import { prisma } from "@/lib/prisma";
import { withAuth, badRequest, ok } from "@/lib/api";
import { updateTaskSchema } from "@/lib/validations";
import { notify } from "@/services/notifications";
import { recomputePhaseProgress } from "@/services/events";
import { canManage } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

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
        select: { id: true, title: true, status: true, assignee: { select: { name: true } } },
      },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      dependencies: {
        include: { dependsOn: { select: { id: true, title: true, status: true } } },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return ok(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const existing = await prisma.task.findUnique({
    where: { id: params.id },
    select: { assigneeId: true, phaseId: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Engineers can update their own task status/progress; managers can update anything.
  const isOwnTask = existing.assigneeId === auth.user.id;
  if (!canManage(auth.user.role) && !isOwnTask) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const d = parsed.data;
  const data: Record<string, unknown> = {};
  if (d.title !== undefined) data.title = d.title;
  if (d.description !== undefined) data.description = d.description;
  if (d.status !== undefined) {
    data.status = d.status;
    data.completedAt = d.status === "DONE" ? new Date() : null;
    if (d.status === "DONE") data.progress = 100;
  }
  if (d.priority !== undefined) data.priority = d.priority;
  if (d.lifecycleStage !== undefined) data.lifecycleStage = d.lifecycleStage;
  if (d.progress !== undefined) data.progress = d.progress;
  if (d.assigneeId !== undefined) data.assigneeId = d.assigneeId || null;
  if (d.phaseId !== undefined) data.phaseId = d.phaseId || null;
  if (d.venueId !== undefined) data.venueId = d.venueId || null;
  if (d.startDate !== undefined)
    data.startDate = d.startDate ? new Date(d.startDate) : null;
  if (d.dueDate !== undefined)
    data.dueDate = d.dueDate ? new Date(d.dueDate) : null;

  const task = await prisma.task.update({
    where: { id: params.id },
    data,
  });

  // Notify a newly-assigned user
  if (
    d.assigneeId !== undefined &&
    d.assigneeId &&
    d.assigneeId !== existing.assigneeId
  ) {
    await notify({
      userId: d.assigneeId,
      title: "Task assigned to you",
      message: `You have been assigned: ${task.title}`,
      type: "TASK_ASSIGNED",
      link: `/tasks/${task.id}`,
    });
  }

  // Recompute affected phase progress
  const phaseToUpdate = task.phaseId ?? existing.phaseId;
  if (phaseToUpdate) {
    await recomputePhaseProgress(phaseToUpdate);
  }

  return ok(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  if (!canManage(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    select: { phaseId: true },
  });

  await prisma.task.delete({ where: { id: params.id } });

  if (task?.phaseId) {
    await recomputePhaseProgress(task.phaseId);
  }

  return ok({ success: true });
}
