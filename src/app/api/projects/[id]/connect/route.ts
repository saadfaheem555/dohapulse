import { prisma } from "@/lib/prisma";
import { withAuth, badRequest, ok } from "@/lib/api";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  if (auth.user.role === "ENGINEER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { targetProjectId } = await req.json();
  if (!targetProjectId) {
    return badRequest("targetProjectId is required");
  }

  // Verify the requesting user owns the source project
  const sourceProject = await prisma.project.findUnique({
    where: { id: params.id },
    select: { managerId: true },
  });

  if (!sourceProject) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (auth.user.role === "MANAGER" && sourceProject.managerId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify target project exists
  const targetProject = await prisma.project.findUnique({
    where: { id: targetProjectId },
    select: { id: true, name: true },
  });

  if (!targetProject) {
    return badRequest("Target project not found");
  }

  // Can't connect to self
  if (params.id === targetProjectId) {
    return badRequest("Cannot connect a project to itself");
  }

  // Check if already connected (either direction)
  const existing = await prisma.projectConnection.findFirst({
    where: {
      OR: [
        { fromProjectId: params.id, toProjectId: targetProjectId },
        { fromProjectId: targetProjectId, toProjectId: params.id },
      ],
    },
  });

  if (existing) {
    return badRequest("Projects are already connected");
  }

  const connection = await prisma.projectConnection.create({
    data: {
      fromProjectId: params.id,
      toProjectId: targetProjectId,
    },
  });

  return ok(connection, 201);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  if (auth.user.role === "ENGINEER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { targetProjectId } = await req.json();

  // Verify user owns one of the projects
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { managerId: true },
  });

  if (auth.user.role === "MANAGER" && project?.managerId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.projectConnection.deleteMany({
    where: {
      OR: [
        { fromProjectId: params.id, toProjectId: targetProjectId },
        { fromProjectId: targetProjectId, toProjectId: params.id },
      ],
    },
  });

  return ok({ success: true });
}
