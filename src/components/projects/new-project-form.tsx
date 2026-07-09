"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { X } from "lucide-react";

type Manager = { id: string; name: string };
type Event = { id: string; name: string };

export function NewProjectForm({
  onClose,
  managers,
  events,
  isAdmin,
}: {
  onClose: () => void;
  managers: Manager[];
  events: Event[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      description: form.get("description"),
      managerId: form.get("managerId") || undefined,
      eventId: form.get("eventId") || undefined,
    };

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create project");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Create Project</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Project Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Venue Technology Rollout" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Optional description" />
          </div>
          {isAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="managerId">Assign to Manager</Label>
              <Select id="managerId" name="managerId">
                <option value="">Select manager...</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="eventId">Link to Event (optional)</Label>
            <Select id="eventId" name="eventId">
              <option value="">No event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating…" : "Create Project"}
          </Button>
        </form>
      </div>
    </div>
  );
}
