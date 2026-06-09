"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";

export function TaskStatusControl({
  taskId,
  status,
  progress,
  canEdit,
}: {
  taskId: string;
  status: string;
  progress: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [prog, setProg] = useState(progress);
  const [saving, setSaving] = useState(false);

  async function update(payload: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={current}
          disabled={!canEdit || saving}
          onChange={(e) => {
            setCurrent(e.target.value);
            update({ status: e.target.value });
          }}
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Progress</label>
          <span className="text-sm text-muted-foreground">{prog}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={prog}
          disabled={!canEdit || saving}
          onChange={(e) => setProg(Number(e.target.value))}
          onMouseUp={() => update({ progress: prog })}
          onTouchEnd={() => update({ progress: prog })}
          className="w-full accent-sky-600"
        />
        <ProgressBar value={prog} color={prog === 100 ? "green" : "primary"} />
      </div>
    </div>
  );
}
