import { PrismaClient, type PhaseName } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PHASE_ORDER: PhaseName[] = [
  "BIDDING",
  "PLANNING",
  "CONSTRUCTION",
  "TESTING",
  "READINESS",
  "GAMES_TIME",
  "LEGACY",
];

// Map each sporting-event phase to a PM lifecycle stage.
const phaseToLifecycle = {
  BIDDING: "INITIATION",
  PLANNING: "PLANNING",
  CONSTRUCTION: "EXECUTION",
  TESTING: "EXECUTION",
  READINESS: "MONITORING_CONTROL",
  GAMES_TIME: "EXECUTION",
  LEGACY: "CLOSURE",
} as const;

async function main() {
  console.log("🌱 Seeding DohaPulse…");

  // ---- Clean slate (dev only) ----
  await prisma.documentShare.deleteMany();
  await prisma.document.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.staffAssignment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.eventPhase.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Passw0rd!", 10);

  // ---- Users ----
  const admin = await prisma.user.create({
    data: {
      name: "Layla Al-Mansoori",
      email: "admin@asiangames2030.qa",
      passwordHash,
      role: "ADMIN",
      department: "Organizing Committee",
      specialization: "Program Director",
      phone: "+974 5000 0001",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Omar Haddad",
      email: "manager@asiangames2030.qa",
      passwordHash,
      role: "MANAGER",
      department: "Technology",
      specialization: "Venue Technology Lead",
      phone: "+974 5000 0002",
    },
  });

  const engineers = await Promise.all(
    [
      { name: "Sara Khan", spec: "Network Engineering", dept: "Technology" },
      { name: "Yusuf Ali", spec: "Audio Visual Systems", dept: "Technology" },
      { name: "Mariam Hassan", spec: "Power & Electrical", dept: "Infrastructure" },
      { name: "Daniel Park", spec: "Broadcast Engineering", dept: "Broadcast" },
      { name: "Aisha Rahman", spec: "Timing & Scoring", dept: "Sport" },
      { name: "Khalid Nasser", spec: "Security Systems", dept: "Security" },
    ].map((e, i) =>
      prisma.user.create({
        data: {
          name: e.name,
          email: `engineer${i === 0 ? "" : i + 1}@asiangames2030.qa`,
          passwordHash,
          role: "ENGINEER",
          department: e.dept,
          specialization: e.spec,
          phone: `+974 5000 01${String(i).padStart(2, "0")}`,
          managerId: i < 3 ? manager.id : null, // first 3 engineers assigned to manager
        },
      })
    )
  );

  console.log(`👤 Created ${2 + engineers.length} staff members`);

  // ---- Event: Asian Games 2030 ----
  const start = new Date("2024-01-01");
  const end = new Date("2031-06-30");
  const event = await prisma.event.create({
    data: {
      name: "Asian Games 2030",
      description:
        "The 21st Asian Games, hosted in Doha, Qatar. A multi-sport continental event spanning the full lifecycle from bidding to legacy.",
      type: "ASIAN_GAMES",
      location: "Doha",
      country: "Qatar",
      startDate: start,
      endDate: end,
      currentPhase: "PLANNING",
      status: "PLANNING",
    },
  });

  // ---- Phases (with realistic, hand-tuned windows) ----
  const phaseWindows: Record<PhaseName, [string, string, number]> = {
    BIDDING: ["2024-01-01", "2024-09-30", 100],
    PLANNING: ["2024-10-01", "2026-06-30", 35],
    CONSTRUCTION: ["2026-07-01", "2028-12-31", 0],
    TESTING: ["2029-01-01", "2029-12-31", 0],
    READINESS: ["2030-01-01", "2030-09-30", 0],
    GAMES_TIME: ["2030-10-01", "2030-11-15", 0],
    LEGACY: ["2030-11-16", "2031-06-30", 0],
  };

  const phases = await Promise.all(
    PHASE_ORDER.map((name, i) => {
      const [s, e, progress] = phaseWindows[name];
      return prisma.eventPhase.create({
        data: {
          eventId: event.id,
          name,
          order: i,
          startDate: new Date(s),
          endDate: new Date(e),
          progress,
          status:
            progress === 100
              ? "COMPLETED"
              : progress > 0
                ? "IN_PROGRESS"
                : "NOT_STARTED",
        },
      });
    })
  );

  const phaseByName = (n: PhaseName) => phases.find((p) => p.name === n)!;
  console.log(`📅 Created ${phases.length} lifecycle phases`);

  // ---- Venues ----
  const venuesData = [
    {
      name: "Lusail Iconic Stadium",
      location: "Lusail",
      capacity: 80000,
      type: "STADIUM" as const,
      status: "OPERATIONAL" as const,
    },
    {
      name: "Aspire Dome",
      location: "Aspire Zone, Doha",
      capacity: 15000,
      type: "INDOOR_HALL" as const,
      status: "OPERATIONAL" as const,
    },
    {
      name: "Hamad Aquatics Centre",
      location: "Aspire Zone, Doha",
      capacity: 6000,
      type: "AQUATICS_CENTER" as const,
      status: "READY" as const,
    },
    {
      name: "Khalifa International Stadium",
      location: "Doha",
      capacity: 45000,
      type: "STADIUM" as const,
      status: "OPERATIONAL" as const,
    },
    {
      name: "Main Operations Centre",
      location: "West Bay, Doha",
      capacity: null,
      type: "OPERATIONS_CENTER" as const,
      status: "OPERATIONAL" as const,
    },
    {
      name: "Athletes' Village",
      location: "Lusail",
      capacity: 12000,
      type: "ACCOMMODATION" as const,
      status: "UNDER_CONSTRUCTION" as const,
    },
  ];

  const venues = await Promise.all(
    venuesData.map((v) =>
      prisma.venue.create({ data: { ...v, eventId: event.id } })
    )
  );
  console.log(`🏟️  Created ${venues.length} venues`);

  // ---- Staff Assignments ----
  await prisma.staffAssignment.createMany({
    data: [
      {
        userId: manager.id,
        eventId: event.id,
        venueId: venues[0].id,
        role: "Venue Technology Manager",
        startDate: new Date("2026-01-01"),
      },
      {
        userId: engineers[0].id,
        eventId: event.id,
        venueId: venues[0].id,
        role: "Network Lead",
        startDate: new Date("2026-02-01"),
      },
      {
        userId: engineers[3].id,
        eventId: event.id,
        venueId: venues[3].id,
        role: "Broadcast Engineer",
        startDate: new Date("2026-03-01"),
      },
    ],
  });

  // ---- Tasks across phases ----
  type TaskSeed = {
    title: string;
    phase: PhaseName;
    venueIdx?: number;
    assignee?: string;
    status?: "TODO" | "IN_PROGRESS" | "BLOCKED" | "REVIEW" | "DONE";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    start?: string;
    due?: string;
    progress?: number;
  };

  const taskSeeds: TaskSeed[] = [
    {
      title: "Submit final bid dossier to OCA",
      phase: "BIDDING",
      status: "DONE",
      priority: "CRITICAL",
      start: "2024-02-01",
      due: "2024-08-15",
      progress: 100,
    },
    {
      title: "Host city contract signing",
      phase: "BIDDING",
      status: "DONE",
      priority: "HIGH",
      start: "2024-08-20",
      due: "2024-09-25",
      progress: 100,
    },
    {
      title: "Develop master operational plan",
      phase: "PLANNING",
      assignee: manager.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      start: "2024-11-01",
      due: "2025-12-31",
      progress: 60,
    },
    {
      title: "Define venue technology requirements",
      phase: "PLANNING",
      venueIdx: 0,
      assignee: engineers[0].id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      start: "2025-01-15",
      due: "2026-03-31",
      progress: 40,
    },
    {
      title: "Procurement strategy for broadcast equipment",
      phase: "PLANNING",
      assignee: engineers[3].id,
      status: "TODO",
      priority: "MEDIUM",
      start: "2025-06-01",
      due: "2026-06-30",
      progress: 0,
    },
    {
      title: "Athletes' Village construction oversight",
      phase: "CONSTRUCTION",
      venueIdx: 5,
      assignee: engineers[2].id,
      status: "TODO",
      priority: "CRITICAL",
      start: "2026-07-01",
      due: "2028-12-31",
      progress: 0,
    },
    {
      title: "Install fibre backbone at Lusail Stadium",
      phase: "CONSTRUCTION",
      venueIdx: 0,
      assignee: engineers[0].id,
      status: "TODO",
      priority: "HIGH",
      start: "2027-01-01",
      due: "2027-09-30",
      progress: 0,
    },
    {
      title: "Test event: Aquatics World Cup",
      phase: "TESTING",
      venueIdx: 2,
      assignee: engineers[4].id,
      status: "TODO",
      priority: "HIGH",
      start: "2029-03-01",
      due: "2029-04-15",
      progress: 0,
    },
    {
      title: "Operational readiness exercises",
      phase: "READINESS",
      assignee: manager.id,
      status: "TODO",
      priority: "CRITICAL",
      start: "2030-02-01",
      due: "2030-08-31",
      progress: 0,
    },
    {
      title: "Games-time venue operations — Opening Ceremony",
      phase: "GAMES_TIME",
      venueIdx: 0,
      assignee: engineers[1].id,
      status: "TODO",
      priority: "CRITICAL",
      start: "2030-10-01",
      due: "2030-10-03",
      progress: 0,
    },
    {
      title: "Decommission temporary infrastructure",
      phase: "LEGACY",
      status: "TODO",
      priority: "MEDIUM",
      start: "2030-11-20",
      due: "2031-03-31",
      progress: 0,
    },
  ];

  const createdTasks = [];
  for (const t of taskSeeds) {
    const task = await prisma.task.create({
      data: {
        title: t.title,
        eventId: event.id,
        phaseId: phaseByName(t.phase).id,
        venueId: t.venueIdx !== undefined ? venues[t.venueIdx].id : null,
        assigneeId: t.assignee ?? null,
        creatorId: admin.id,
        status: t.status ?? "TODO",
        priority: t.priority ?? "MEDIUM",
        lifecycleStage: phaseToLifecycle[t.phase],
        startDate: t.start ? new Date(t.start) : null,
        dueDate: t.due ? new Date(t.due) : null,
        progress: t.progress ?? 0,
        completedAt: t.status === "DONE" ? new Date() : null,
      },
    });
    createdTasks.push(task);
  }
  console.log(`✅ Created ${createdTasks.length} tasks`);

  // ---- A dependency: fibre install depends on tech requirements ----
  const reqTask = createdTasks.find((t) =>
    t.title.includes("venue technology requirements")
  );
  const fibreTask = createdTasks.find((t) =>
    t.title.includes("fibre backbone")
  );
  if (reqTask && fibreTask) {
    await prisma.taskDependency.create({
      data: {
        taskId: fibreTask.id,
        dependsOnTaskId: reqTask.id,
        type: "FINISH_TO_START",
      },
    });
  }

  // ---- A subtask example ----
  const planTask = createdTasks.find((t) =>
    t.title.includes("master operational plan")
  );
  if (planTask) {
    await prisma.task.create({
      data: {
        title: "Draft transport & logistics annex",
        eventId: event.id,
        phaseId: phaseByName("PLANNING").id,
        parentTaskId: planTask.id,
        assigneeId: manager.id,
        creatorId: admin.id,
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        lifecycleStage: "PLANNING",
        progress: 30,
      },
    });
  }

  // ---- Welcome notifications ----
  await prisma.notification.createMany({
    data: [admin, manager, ...engineers].map((u) => ({
      userId: u.id,
      title: "Welcome to DohaPulse",
      message: "Your account is ready. Explore your tasks and assignments.",
      type: "SYSTEM" as const,
    })),
  });

  console.log("🎉 Seed complete.");
  console.log("\nLogin with:");
  console.log("  admin@asiangames2030.qa    / Passw0rd!  (Admin)");
  console.log("  manager@asiangames2030.qa  / Passw0rd!  (Manager)");
  console.log("  engineer@asiangames2030.qa / Passw0rd!  (Engineer)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
