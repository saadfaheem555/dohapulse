"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { X } from "lucide-react";

type Project = { id: string; name: string; manager?: { name: string } | null };

export function ConnectProjectForm({
  onClose,
  projectId,
  projectName,
  availableProjects,
}: {
  onClose: () => void;
  projectId: string;
  projectName: string;
  availableProjects: Project[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const targetProjectId = form.get("targetProjectId");

    const res = await fetch(`/api/projects/${projectId}/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetProjectId }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to connect projects");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Connect Project</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            Connect <strong>{projectName}</strong> to another manager&apos;s project.
            Both teams will have shared access.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="targetProjectId">Select Project</Label>
            <Select id="targetProjectId" name="targetProjectId" required>
              <option value="">Choose a project...</option>
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.manager ? `(${p.manager.name})` : ""}
                </option>
              ))}
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Connecting…" : "Connect Projects"}
          </Button>
        </form>
      </div>
    </div>
  );
}
