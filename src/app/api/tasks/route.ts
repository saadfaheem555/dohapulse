import { prisma } from "@/lib/prisma";
import { withAuth, requireManager, badRequest, ok } from "@/lib/api";
import { createTaskSchema } from "@/lib/validations";
import { notify } from "@/services/notifications";
import { recomputePhaseProgress } from "@/services/events";
import { NextRequest } from "next/server";
import { type Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const phaseId = searchParams.get("phaseId");
  const venueId = searchParams.get("venueId");
  const assigneeId = searchParams.get("assigneeId");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const where: Prisma.TaskWhereInput = {
    AND: [
      eventId ? { eventId } : {},
      phaseId ? { phaseId } : {},
      venueId ? { venueId } : {},
      assigneeId ? { assigneeId } : {},
      status ? { status: status as never } : {},
      q ? { title: { contains: q, mode: "insensitive" } } : {},
    ],
  };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true } },
      event: { select: { name: true } },
      phase: { select: { name: true } },
      venue: { select: { name: true } },
      _count: { select: { subtasks: true, dependencies: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return ok(tasks);
}

export async function POST(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const forbidden = requireManager(auth.user);
  if (forbidden) return forbidden;

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const d = parsed.data;
  const task = await prisma.task.create({
    data: {
      title: d.title,
      description: d.description ?? null,
      eventId: d.eventId,
      phaseId: d.phaseId || null,
      venueId: d.venueId || null,
      parentTaskId: d.parentTaskId || null,
      assigneeId: d.assigneeId || null,
      priority: d.priority,
      lifecycleStage: d.lifecycleStage,
      status: d.status,
      startDate: d.startDate ? new Date(d.startDate) : null,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      creatorId: auth.user.id,
    },
  });

  if (task.assigneeId) {
    await notify({
      userId: task.assigneeId,
      title: "New task assigned",
      message: `You have been assigned: ${task.title}`,
      type: "TASK_ASSIGNED",
      link: `/tasks/${task.id}`,
    });
  }

  if (task.phaseId) {
    await recomputePhaseProgress(task.phaseId);
  }

  return ok(task, 201);
}
