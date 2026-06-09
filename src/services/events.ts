import { prisma } from "@/lib/prisma";
import { PHASE_ORDER } from "@/lib/labels";
import { type PhaseName, type LifecycleStage } from "@prisma/client";

/**
 * Standard project-management lifecycle (PMBOK process groups) scaffold.
 * Every new event is initialized with these milestone tasks so the project
 * is run through a consistent methodology. All start as TODO (not started).
 */
const LIFECYCLE_TEMPLATE: {
  stage: LifecycleStage;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}[] = [
  { stage: "INITIATION", title: "Develop project charter", priority: "CRITICAL" },
  { stage: "INITIATION", title: "Identify key stakeholders", priority: "HIGH" },
  { stage: "PLANNING", title: "Develop project management plan", priority: "CRITICAL" },
  { stage: "PLANNING", title: "Define scope & work breakdown structure", priority: "HIGH" },
  { stage: "PLANNING", title: "Build master schedule & budget", priority: "HIGH" },
  { stage: "PLANNING", title: "Risk management plan", priority: "HIGH" },
  { stage: "EXECUTION", title: "Mobilize project team & resources", priority: "HIGH" },
  { stage: "EXECUTION", title: "Execute project deliverables", priority: "MEDIUM" },
  { stage: "MONITORING_CONTROL", title: "Track progress & performance KPIs", priority: "HIGH" },
  { stage: "MONITORING_CONTROL", title: "Manage changes, risks & issues", priority: "MEDIUM" },
  { stage: "CLOSURE", title: "Final deliverable handover & sign-off", priority: "HIGH" },
  { stage: "CLOSURE", title: "Capture lessons learned & close project", priority: "MEDIUM" },
];

/**
 * Distributes phase dates evenly across the event window when phases are
 * auto-generated. Each of the 7 lifecycle phases is created in order, and the
 * project is scaffolded with the standard PM lifecycle milestone tasks.
 */
export async function createEventWithPhases(input: {
  name: string;
  description?: string | null;
  type: never;
  location: string;
  country: string;
  startDate: Date;
  endDate: Date;
  creatorId: string;
}) {
  const event = await prisma.event.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      location: input.location,
      country: input.country,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });

  const totalMs = input.endDate.getTime() - input.startDate.getTime();
  const slice = totalMs / PHASE_ORDER.length;

  await prisma.eventPhase.createMany({
    data: PHASE_ORDER.map((name, i) => ({
      eventId: event.id,
      name,
      order: i,
      startDate: new Date(input.startDate.getTime() + slice * i),
      endDate: new Date(input.startDate.getTime() + slice * (i + 1)),
    })),
  });

  // Scaffold the project-management lifecycle milestone tasks.
  await prisma.task.createMany({
    data: LIFECYCLE_TEMPLATE.map((t) => ({
      title: t.title,
      eventId: event.id,
      creatorId: input.creatorId,
      status: "TODO" as const,
      priority: t.priority,
      lifecycleStage: t.stage,
    })),
  });

  return event;
}

/**
 * Recomputes a phase's progress based on the completion of its tasks,
 * then rolls the dominant phase status up to the event's currentPhase.
 */
export async function recomputePhaseProgress(phaseId: string) {
  const tasks = await prisma.task.findMany({
    where: { phaseId },
    select: { status: true },
  });

  if (tasks.length === 0) {
    await prisma.eventPhase.update({
      where: { id: phaseId },
      data: { progress: 0 },
    });
    return;
  }

  const done = tasks.filter((t) => t.status === "DONE").length;
  const progress = Math.round((done / tasks.length) * 100);

  await prisma.eventPhase.update({
    where: { id: phaseId },
    data: {
      progress,
      status:
        progress === 100
          ? "COMPLETED"
          : progress > 0
            ? "IN_PROGRESS"
            : "NOT_STARTED",
    },
  });
}

export async function advanceEventPhase(eventId: string, target: PhaseName) {
  await prisma.event.update({
    where: { id: eventId },
    data: { currentPhase: target },
  });
}
