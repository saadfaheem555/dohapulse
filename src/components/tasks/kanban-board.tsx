"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  taskStatusLabels,
  taskPriorityColors,
  taskPriorityLabels,
} from "@/lib/labels";
import { type TaskListItem } from "./types";
import { type TaskStatus, type TaskPriority } from "@prisma/client";
import { GripVertical, CalendarClock } from "lucide-react";

const COLUMNS: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "REVIEW",
  "DONE",
];

const columnAccent: Record<TaskStatus, string> = {
  TODO: "border-t-slate-400",
  IN_PROGRESS: "border-t-sky-500",
  BLOCKED: "border-t-red-500",
  REVIEW: "border-t-violet-500",
  DONE: "border-t-emerald-500",
};

export function KanbanBoard({ tasks }: { tasks: TaskListItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(tasks);
  const [dragId, setDragId] = useState<string | null>(null);

  async function moveTask(id: string, status: TaskStatus) {
    const prev = items;
    setItems((cur) =>
      cur.map((t) => (t.id === id ? { ...t, status } : t))
    );

    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      setItems(prev); // rollback
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-4 overflow-x-auto thin-scroll pb-4">
      {COLUMNS.map((col) => {
        const colTasks = items.filter((t) => t.status === col);
        return (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) moveTask(dragId, col);
              setDragId(null);
            }}
            className={`flex w-72 shrink-0 flex-col rounded-lg border border-t-4 border-border bg-secondary/30 ${columnAccent[col]}`}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm font-semibold">
                {taskStatusLabels[col]}
              </span>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">
                {colTasks.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 px-2 pb-3">
              {colTasks.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  onDragEnd={() => setDragId(null)}
                  className="group cursor-grab rounded-md border border-border bg-card p-3 shadow-sm active:cursor-grabbing"
                >
                  <div className="flex items-start gap-1.5">
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    <Link
                      href={`/tasks/${t.id}`}
                      className="flex-1 text-sm font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-5">
                    <Badge
                      color={taskPriorityColors[t.priority as TaskPriority]}
                    >
                      {taskPriorityLabels[t.priority as TaskPriority]}
                    </Badge>
                    {t.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3" />
                        {formatDate(t.dueDate)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 truncate pl-5 text-xs text-muted-foreground">
                    {t.assignee?.name ?? "Unassigned"} · {t.event.name}
                  </p>
                </div>
              ))}
              {colTasks.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Drop tasks here
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
