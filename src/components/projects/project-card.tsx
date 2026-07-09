"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConnectProjectForm } from "./connect-project-form";

type ConnectedProject = {
  id: string;
  name: string;
  manager?: { name: string } | null;
};

type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  creator: { id: string; name: string };
  manager: { id: string; name: string } | null;
  event: { id: string; name: string } | null;
  connectionsFrom: { toProject: ConnectedProject }[];
  connectionsTo: { fromProject: ConnectedProject }[];
};

export function ProjectCard({
  project,
  canManageProject,
  allProjects,
}: {
  project: Project;
  canManageProject: boolean;
  allProjects: { id: string; name: string; manager?: { name: string } | null }[];
}) {
  const router = useRouter();
  const [showConnect, setShowConnect] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Get all connected projects (bidirectional)
  const connected: ConnectedProject[] = [
    ...project.connectionsFrom.map((c) => c.toProject),
    ...project.connectionsTo.map((c) => c.fromProject),
  ];

  // Available projects to connect (exclude self and already connected)
  const connectedIds = new Set([project.id, ...connected.map((c) => c.id)]);
  const availableProjects = allProjects.filter((p) => !connectedIds.has(p.id));

  async function handleDelete() {
    if (!confirm(`Delete project "${project.name}"?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete project");
      setDeleting(false);
    }
  }

  async function handleDisconnect(targetId: string) {
    const res = await fetch(`/api/projects/${project.id}/connect`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetProjectId: targetId }),
    });
    if (res.ok) router.refresh();
  }

  const statusColor = (
    {
      ACTIVE: "green",
      COMPLETED: "blue",
      ARCHIVED: "gray",
    } as const
  )[project.status as "ACTIVE" | "COMPLETED" | "ARCHIVED"] ?? "gray";

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{project.name}</h3>
              {project.description && (
                <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
              )}
            </div>
            <Badge color={statusColor}>{project.status}</Badge>
          </div>

          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {project.manager && <p>Manager: <strong>{project.manager.name}</strong></p>}
            {project.event && <p>Event: {project.event.name}</p>}
          </div>

          {connected.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Connected Projects</p>
              <div className="space-y-1">
                {connected.map((cp) => (
                  <div key={cp.id} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-1.5 text-sm">
                    <span>
                      <Link2 className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" />
                      {cp.name}
                      {cp.manager && <span className="ml-1 text-xs text-muted-foreground">({cp.manager.name})</span>}
                    </span>
                    {canManageProject && (
                      <button
                        onClick={() => handleDisconnect(cp.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {canManageProject && (
            <div className="mt-4 flex gap-2 border-t border-border pt-3">
              <button
                onClick={() => setShowConnect(true)}
                disabled={availableProjects.length === 0}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50"
              >
                <Link2 className="h-3.5 w-3.5" /> Connect
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {showConnect && (
        <ConnectProjectForm
          onClose={() => setShowConnect(false)}
          projectId={project.id}
          projectName={project.name}
          availableProjects={availableProjects}
        />
      )}
    </>
  );
}
