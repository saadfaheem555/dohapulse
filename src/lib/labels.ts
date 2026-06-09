import {
  type TaskStatus,
  type TaskPriority,
  type PhaseName,
  type PhaseStatus,
  type VenueStatus,
  type EventStatus,
  type Role,
  type LifecycleStage,
} from "@prisma/client";

type Color =
  | "gray"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "purple"
  | "orange";

export const PHASE_ORDER: PhaseName[] = [
  "BIDDING",
  "PLANNING",
  "CONSTRUCTION",
  "TESTING",
  "READINESS",
  "GAMES_TIME",
  "LEGACY",
];

export const phaseLabels: Record<PhaseName, string> = {
  BIDDING: "Bidding",
  PLANNING: "Planning",
  CONSTRUCTION: "Construction",
  TESTING: "Testing",
  READINESS: "Readiness",
  GAMES_TIME: "Games-time",
  LEGACY: "Legacy",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  REVIEW: "In Review",
  DONE: "Done",
};

export const taskStatusColors: Record<TaskStatus, Color> = {
  TODO: "gray",
  IN_PROGRESS: "blue",
  BLOCKED: "red",
  REVIEW: "purple",
  DONE: "green",
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const taskPriorityColors: Record<TaskPriority, Color> = {
  LOW: "gray",
  MEDIUM: "blue",
  HIGH: "orange",
  CRITICAL: "red",
};

export const phaseStatusColors: Record<PhaseStatus, Color> = {
  NOT_STARTED: "gray",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  ON_HOLD: "yellow",
};

export const phaseStatusLabels: Record<PhaseStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
};

export const venueStatusColors: Record<VenueStatus, Color> = {
  PLANNED: "gray",
  UNDER_CONSTRUCTION: "yellow",
  READY: "blue",
  OPERATIONAL: "green",
  DECOMMISSIONED: "red",
};

export const venueStatusLabels: Record<VenueStatus, string> = {
  PLANNED: "Planned",
  UNDER_CONSTRUCTION: "Under Construction",
  READY: "Ready",
  OPERATIONAL: "Operational",
  DECOMMISSIONED: "Decommissioned",
};

export const eventStatusColors: Record<EventStatus, Color> = {
  PLANNING: "blue",
  ACTIVE: "green",
  COMPLETED: "gray",
  ARCHIVED: "gray",
};

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  ENGINEER: "Engineer / Staff",
};

export const roleColors: Record<Role, Color> = {
  ADMIN: "purple",
  MANAGER: "blue",
  ENGINEER: "gray",
};

// ----- Project management lifecycle (PMBOK process groups) -----

export const LIFECYCLE_ORDER: LifecycleStage[] = [
  "INITIATION",
  "PLANNING",
  "EXECUTION",
  "MONITORING_CONTROL",
  "CLOSURE",
];

export const lifecycleLabels: Record<LifecycleStage, string> = {
  INITIATION: "Initiation",
  PLANNING: "Planning",
  EXECUTION: "Execution",
  MONITORING_CONTROL: "Monitoring & Control",
  CLOSURE: "Closure",
};

export const lifecycleDescriptions: Record<LifecycleStage, string> = {
  INITIATION: "Define the project, charter, and stakeholders.",
  PLANNING: "Scope, schedule, budget, and risk planning.",
  EXECUTION: "Mobilize teams and deliver the work.",
  MONITORING_CONTROL: "Track progress, manage changes and risks.",
  CLOSURE: "Handover, lessons learned, and formal close.",
};

export const lifecycleColors: Record<LifecycleStage, Color> = {
  INITIATION: "purple",
  PLANNING: "blue",
  EXECUTION: "orange",
  MONITORING_CONTROL: "yellow",
  CLOSURE: "green",
};
