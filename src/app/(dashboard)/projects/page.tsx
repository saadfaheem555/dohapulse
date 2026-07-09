import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewProjectButton } from "@/components/projects/new-project-button";
import { ProjectCard } from "@/components/projects/project-card";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Fetch projects based on role
  let where = {};

  if (user.role === "ADMIN") {
    where = {};
  } else if (user.role === "MANAGER") {
    const myProjects = await prisma.project.findMany({
      where: { managerId: user.id },
      select: { id: true },
    });
    const myProjectIds = myProjects.map((p) => p.id);

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
    // Engineer
    const myManager = await prisma.user.findUnique({
      where: { id: user.id },
      select: { managerId: true },
    });

    if (!myManager?.managerId) {
      where = { id: { in: [] } };
    } else {
      const managerProjects = await prisma.project.findMany({
        where: { managerId: myManager.managerId },
        select: { id: true },
      });
      const managerProjectIds = managerProjects.map((p) => p.id);

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
  }

  const [projects, managers, events] = await Promise.all([
    prisma.project.findMany({
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
    }),
    prisma.user.findMany({
      where: { role: { in: ["MANAGER", "ADMIN"] }, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.event.findMany({
      select: { id: true, name: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  // All projects for connecting (admins/managers)
  const allProjectsForConnect = await prisma.project.findMany({
    select: { id: true, name: true, manager: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const canCreate = user.role === "ADMIN" || user.role === "MANAGER";

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage projects and cross-team collaboration."
        action={
          canCreate ? (
            <NewProjectButton
              managers={managers}
              events={events}
              isAdmin={user.role === "ADMIN"}
            />
          ) : undefined
        }
      />

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No projects yet.{" "}
            {canCreate ? "Create your first project to get started." : "Your manager hasn't created any projects yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              canManageProject={
                user.role === "ADMIN" ||
                (user.role === "MANAGER" && project.managerId === user.id)
              }
              allProjects={allProjectsForConnect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
