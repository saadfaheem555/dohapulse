"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

type EventOption = { id: string; name: string };

export function NewVenueButton({
  events,
  defaultEventId,
}: {
  events: EventOption[];
  defaultEventId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create venue");
      return;
    }

    router.refresh();
    setOpen(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={events.length === 0}>
        <Plus className="h-4 w-4" />
        Add Venue
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold">Add Venue</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="eventId">Event</Label>
                <Select
                  id="eventId"
                  name="eventId"
                  required
                  defaultValue={defaultEventId ?? events[0]?.id}
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="name">Venue name</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Lusail Stadium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    required
                    placeholder="Lusail"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    placeholder="80000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type">Type</Label>
                  <Select id="type" name="type" defaultValue="STADIUM">
                    <option value="STADIUM">Stadium</option>
                    <option value="ARENA">Arena</option>
                    <option value="AQUATICS_CENTER">Aquatics Center</option>
                    <option value="INDOOR_HALL">Indoor Hall</option>
                    <option value="OUTDOOR_FIELD">Outdoor Field</option>
                    <option value="TRAINING_FACILITY">Training Facility</option>
                    <option value="OPERATIONS_CENTER">Operations Center</option>
                    <option value="ACCOMMODATION">Accommodation</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" name="status" defaultValue="PLANNED">
                    <option value="PLANNED">Planned</option>
                    <option value="UNDER_CONSTRUCTION">
                      Under Construction
                    </option>
                    <option value="READY">Ready</option>
                    <option value="OPERATIONAL">Operational</option>
                    <option value="DECOMMISSIONED">Decommissioned</option>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Notes about the venue…"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Add Venue"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
