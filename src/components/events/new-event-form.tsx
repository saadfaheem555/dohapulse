"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { X } from "lucide-react";

export function NewEventForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create event");
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Create Event</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Event name</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Asian Games 2030"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief overview of the event…"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" defaultValue="ASIAN_GAMES">
                <option value="ASIAN_GAMES">Asian Games</option>
                <option value="OLYMPICS">Olympics</option>
                <option value="WORLD_CUP">World Cup</option>
                <option value="COMMONWEALTH_GAMES">Commonwealth Games</option>
                <option value="CONTINENTAL_CHAMPIONSHIP">
                  Continental Championship
                </option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                required
                defaultValue="Qatar"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                required
                placeholder="Doha"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>
          </div>

          <p className="rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
            7 lifecycle phases (Bidding → Legacy) will be generated automatically
            across this date range.
          </p>

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
              {loading ? "Creating…" : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
