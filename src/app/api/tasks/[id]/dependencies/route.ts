import { prisma } from "@/lib/prisma";
import { withAuth, requireManager, badRequest, ok } from "@/lib/api";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  dependsOnTaskId: z.string().min(1),
  type: z
    .enum([
      "FINISH_TO_START",
      "START_TO_START",
      "FINISH_TO_FINISH",
      "START_TO_FINISH",
    ])
    .default("FINISH_TO_START"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const forbidden = requireManager(auth.user);
  if (forbidden) return forbidden;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  if (parsed.data.dependsOnTaskId === params.id) {
    return badRequest("A task cannot depend on itself");
  }

  const dep = await prisma.taskDependency.create({
    data: {
      taskId: params.id,
      dependsOnTaskId: parsed.data.dependsOnTaskId,
      type: parsed.data.type,
    },
  });

  return ok(dep, 201);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const forbidden = requireManager(auth.user);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(req.url);
  const dependsOnTaskId = searchParams.get("dependsOnTaskId");
  if (!dependsOnTaskId) return badRequest("dependsOnTaskId is required");

  await prisma.taskDependency.deleteMany({
    where: { taskId: params.id, dependsOnTaskId },
  });

  return ok({ success: true });
}
