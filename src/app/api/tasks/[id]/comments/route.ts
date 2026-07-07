import { prisma } from "@/lib/prisma";
import { withAuth, badRequest, ok } from "@/lib/api";
import { notify, notifyManager } from "@/services/notifications";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({ content: z.string().min(1).max(2000) });

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Comment cannot be empty");
  }

  const comment = await prisma.taskComment.create({
    data: {
      taskId: params.id,
      authorId: auth.user.id,
      content: parsed.data.content,
    },
    include: { author: { select: { name: true } } },
  });

  // Notify the assignee (if different from commenter)
  const task = await prisma.task.findUnique({
    where: { id: params.id },
    select: { assigneeId: true, title: true },
  });
  if (task?.assigneeId && task.assigneeId !== auth.user.id) {
    await notify({
      userId: task.assigneeId,
      title: "New comment on your task",
      message: `${auth.user.name ?? "Someone"} commented on "${task.title}"`,
      type: "TASK_UPDATED",
      link: `/tasks/${params.id}`,
    });
  }

  // If engineer commented, also notify their manager
  if (auth.user.role === "ENGINEER") {
    await notifyManager(auth.user.id, {
      title: "Engineer commented on a task",
      message: `${auth.user.name ?? "An engineer"} commented on "${task?.title}"`,
      type: "TASK_UPDATED",
      link: `/tasks/${params.id}`,
    });
  }

  return ok(comment, 201);
}
