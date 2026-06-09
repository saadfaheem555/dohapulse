"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { X } from "lucide-react";
import { type EventOption, type StaffOption } from "./types";

export function NewTaskForm({
  events,
  staff,
  defaultEventId,
  onClose,
}: {
  events: EventOption[];
  staff: StaffOption[];
  defaultEventId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState(
    defaultEventId ?? events[0]?.id ?? ""
  );

  const selectedEvent = events.find((e) => e.id === eventId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create task");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="text-lg font-semibold">Create Task</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Deploy venue network backbone"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eventId">Event</Label>
            <Select
              id="eventId"
              name="eventId"
              required
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phaseId">Phase</Label>
              <Select id="phaseId" name="phaseId" defaultValue="">
                <option value="">— None —</option>
                {selectedEvent?.phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venueId">Venue</Label>
              <Select id="venueId" name="venueId" defaultValue="">
                <option value="">— None —</option>
                {selectedEvent?.venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assigneeId">Assignee</Label>
              <Select id="assigneeId" name="assigneeId" defaultValue="">
                <option value="">— Unassigned —</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" name="priority" defaultValue="MEDIUM">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="lifecycleStage">Project lifecycle stage</Label>
              <Select
                id="lifecycleStage"
                name="lifecycleStage"
                defaultValue="PLANNING"
              >
                <option value="INITIATION">Initiation</option>
                <option value="PLANNING">Planning</option>
                <option value="EXECUTION">Execution</option>
                <option value="MONITORING_CONTROL">Monitoring &amp; Control</option>
                <option value="CLOSURE">Closure</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
