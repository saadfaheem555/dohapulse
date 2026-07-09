import { prisma } from "@/lib/prisma";
import { withAuth, badRequest, ok } from "@/lib/api";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  let where = {};

  if (auth.user.role === "ADMIN") {
    // Admin sees all projects
    where = {};
  } else if (auth.user.role === "MANAGER") {
    // Manager sees: projects assigned to them + connected projects
    const myProjects = await prisma.project.findMany({
      where: { managerId: auth.user.id },
      select: { id: true },
    });
    const myProjectIds = myProjects.map((p) => p.id);

    // Find connected project IDs (bidirectional)
    const connections = await prisma.projectConnection.findMany({
      where: {
        OR: [
          { fromProjectId: { in: myProjectIds } },
          { toProjectId: { in: myProjectIds } },
        ],
      },
    });
    const connectedIds = new Set<string>();
    connections.forEach((c) => {
      connectedIds.add(c.fromProjectId);
      connectedIds.add(c.toProjectId);
    });

    where = { id: { in: [...myProjectIds, ...connectedIds] } };
  } else {
    // Engineer sees projects where their manager is the project manager
    // + connected projects
    const myManager = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { managerId: true },
    });

    if (!myManager?.managerId) {
      return ok([]);
    }

    const managerProjects = await prisma.project.findMany({
      where: { managerId: myManager.managerId },
      select: { id: true },
    });
    const managerProjectIds = managerProjects.map((p) => p.id);

    // Also include connected projects
    const connections = await prisma.projectConnection.findMany({
      where: {
        OR: [
          { fromProjectId: { in: managerProjectIds } },
          { toProjectId: { in: managerProjectIds } },
        ],
      },
    });
    const connectedIds = new Set<string>();
    connections.forEach((c) => {
      connectedIds.add(c.fromProjectId);
      connectedIds.add(c.toProjectId);
    });

    where = { id: { in: [...managerProjectIds, ...connectedIds] } };
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
      event: { select: { id: true, name: true } },
      connectionsFrom: {
        include: { toProject: { select: { id: true, name: true, manager: { select: { name: true } } } } },
      },
      connectionsTo: {
        include: { fromProject: { select: { id: true, name: true, manager: { select: { name: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(projects);
}

export async function POST(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  // Only admins and managers can create projects
  if (auth.user.role === "ENGINEER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, managerId, eventId } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return badRequest("Project name is required");
  }

  // Admin creates and assigns to a manager
  // Manager creates their own project
  let assignedManagerId = auth.user.id;
  if (auth.user.role === "ADMIN") {
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: { role: true },
      });
      if (!manager || (manager.role !== "MANAGER" && manager.role !== "ADMIN")) {
        return badRequest("Invalid manager");
      }
      assignedManagerId = managerId;
    } else {
      assignedManagerId = auth.user.id;
    }
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      creatorId: auth.user.id,
      managerId: assignedManagerId,
      eventId: eventId || null,
    },
    include: {
      creator: { select: { name: true } },
      manager: { select: { name: true } },
    },
  });

  return ok(project, 201);
}
