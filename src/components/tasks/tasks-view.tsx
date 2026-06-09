"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { KanbanBoard } from "./kanban-board";
import { GanttChart } from "./gantt-chart";
import { NewTaskForm } from "./new-task-form";
import { formatDate } from "@/lib/utils";
import {
  taskStatusColors,
  taskStatusLabels,
  taskPriorityColors,
  taskPriorityLabels,
  phaseLabels,
} from "@/lib/labels";
import { type TaskListItem, type EventOption, type StaffOption } from "./types";
import {
  type TaskStatus,
  type TaskPriority,
  type PhaseName,
} from "@prisma/client";
import { Plus, LayoutList, Columns3, GanttChartSquare } from "lucide-react";

type View = "list" | "board" | "gantt";

export function TasksView({
  tasks,
  events,
  staff,
  canManage,
}: {
  tasks: TaskListItem[];
  events: EventOption[];
  staff: StaffOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("board");
  const [showForm, setShowForm] = useState(false);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/tasks?${params.toString()}`);
  }

  const views: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "board", label: "Board", icon: <Columns3 className="h-4 w-4" /> },
    { id: "list", label: "List", icon: <LayoutList className="h-4 w-4" /> },
    {
      id: "gantt",
      label: "Gantt",
      icon: <GanttChartSquare className="h-4 w-4" />,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border bg-card p-0.5">
          {views.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                view === v.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            defaultValue={searchParams.get("eventId") ?? ""}
            onChange={(e) => updateParam("eventId", e.target.value)}
            className="w-48"
          >
            <option value="">All events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
          <Select
            defaultValue={searchParams.get("status") ?? ""}
            onChange={(e) => updateParam("status", e.target.value)}
            className="w-40"
          >
            <option value="">All statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </Select>
          {canManage && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {view === "board" && <KanbanBoard tasks={tasks} />}
      {view === "gantt" && <GanttChart tasks={tasks} />}
      {view === "list" && <TaskList tasks={tasks} />}

      {showForm && (
        <NewTaskForm
          events={events}
          staff={staff}
          defaultEventId={searchParams.get("eventId") ?? undefined}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function TaskList({ tasks }: { tasks: TaskListItem[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto thin-scroll">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium">Phase</th>
              <th className="px-4 py-3 font-medium">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((t) => (
                <tr key={t.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/tasks/${t.id}`}
                      className="font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {t.event.name}
                      {t.subtaskCount > 0 ? ` · ${t.subtaskCount} subtasks` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={taskStatusColors[t.status as TaskStatus]}>
                      {taskStatusLabels[t.status as TaskStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      color={taskPriorityColors[t.priority as TaskPriority]}
                    >
                      {taskPriorityLabels[t.priority as TaskPriority]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.assignee?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.phase ? phaseLabels[t.phase.name as PhaseName] : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(t.dueDate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
