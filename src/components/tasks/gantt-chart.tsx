"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { taskStatusColors } from "@/lib/labels";
import { type TaskListItem } from "./types";
import { type TaskStatus } from "@prisma/client";

const statusBarColor: Record<TaskStatus, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-sky-500",
  BLOCKED: "bg-red-500",
  REVIEW: "bg-violet-500",
  DONE: "bg-emerald-500",
};

const DAY = 1000 * 60 * 60 * 24;

export function GanttChart({ tasks }: { tasks: TaskListItem[] }) {
  const scheduled = tasks.filter((t) => t.startDate && t.dueDate);

  if (scheduled.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
        No scheduled tasks. Add start and due dates to tasks to see the Gantt
        timeline.
      </div>
    );
  }

  const starts = scheduled.map((t) => new Date(t.startDate!).getTime());
  const ends = scheduled.map((t) => new Date(t.dueDate!).getTime());
  const min = Math.min(...starts);
  const max = Math.max(...ends);
  const totalSpan = Math.max(max - min, DAY);

  // Build month gridlines
  const months: { label: string; offset: number }[] = [];
  const cursor = new Date(min);
  cursor.setDate(1);
  while (cursor.getTime() <= max) {
    months.push({
      label: cursor.toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
      }),
      offset: ((cursor.getTime() - min) / totalSpan) * 100,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="overflow-x-auto thin-scroll rounded-lg border border-border bg-card">
      <div className="min-w-[800px]">
        {/* Month header */}
        <div className="relative h-8 border-b border-border bg-secondary/40">
          {months.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 flex h-full items-center border-l border-border pl-1 text-[11px] text-muted-foreground"
              style={{ left: `${m.offset}%` }}
            >
              {m.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {scheduled.map((t) => {
            const start = new Date(t.startDate!).getTime();
            const end = new Date(t.dueDate!).getTime();
            const left = ((start - min) / totalSpan) * 100;
            const width = Math.max(((end - start) / totalSpan) * 100, 1.5);

            return (
              <div
                key={t.id}
                className="relative flex items-center hover:bg-secondary/30"
              >
                {/* Month gridlines */}
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-border/50"
                    style={{ left: `${m.offset}%` }}
                  />
                ))}
                <div className="z-10 w-52 shrink-0 truncate px-3 py-2.5 text-sm">
                  <Link href={`/tasks/${t.id}`} className="hover:underline">
                    {t.title}
                  </Link>
                </div>
                <div className="relative h-10 flex-1">
                  <Link
                    href={`/tasks/${t.id}`}
                    title={`${t.title} · ${formatDate(t.startDate)} → ${formatDate(t.dueDate)}`}
                    className={`absolute top-1/2 flex h-6 -translate-y-1/2 items-center overflow-hidden rounded px-2 text-[11px] font-medium text-white ${statusBarColor[t.status as TaskStatus]}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <span className="truncate">{t.progress}%</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
