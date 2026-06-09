export type StaffOption = { id: string; name: string };
export type EventOption = {
  id: string;
  name: string;
  phases: { id: string; name: string }[];
  venues: { id: string; name: string }[];
};

export type TaskListItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string | null;
  dueDate: string | null;
  assignee: { id: string; name: string } | null;
  event: { name: string };
  phase: { name: string } | null;
  venue: { name: string } | null;
  subtaskCount: number;
};
