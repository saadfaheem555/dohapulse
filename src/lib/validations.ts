import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "MANAGER", "ENGINEER"]).default("ENGINEER"),
  department: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "MANAGER", "ENGINEER"]).optional(),
  department: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
});

export const createEventSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  type: z
    .enum([
      "ASIAN_GAMES",
      "OLYMPICS",
      "WORLD_CUP",
      "COMMONWEALTH_GAMES",
      "CONTINENTAL_CHAMPIONSHIP",
      "OTHER",
    ])
    .default("ASIAN_GAMES"),
  location: z.string().min(2),
  country: z.string().min(2),
  startDate: z.string(),
  endDate: z.string(),
});

export const createVenueSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(2),
  location: z.string().min(2),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  type: z
    .enum([
      "STADIUM",
      "ARENA",
      "AQUATICS_CENTER",
      "INDOOR_HALL",
      "OUTDOOR_FIELD",
      "TRAINING_FACILITY",
      "OPERATIONS_CENTER",
      "ACCOMMODATION",
      "OTHER",
    ])
    .default("STADIUM"),
  status: z
    .enum([
      "PLANNED",
      "UNDER_CONSTRUCTION",
      "READY",
      "OPERATIONAL",
      "DECOMMISSIONED",
    ])
    .default("PLANNED"),
  description: z.string().optional().nullable(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  eventId: z.string().min(1),
  phaseId: z.string().optional().nullable(),
  venueId: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  lifecycleStage: z
    .enum([
      "INITIATION",
      "PLANNING",
      "EXECUTION",
      "MONITORING_CONTROL",
      "CLOSURE",
    ])
    .default("PLANNING"),
  status: z
    .enum(["TODO", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE"])
    .default("TODO"),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  progress: z.coerce.number().int().min(0).max(100).optional(),
});

export const createAssignmentSchema = z.object({
  userId: z.string().min(1),
  eventId: z.string().min(1),
  venueId: z.string().optional().nullable(),
  phaseId: z.string().optional().nullable(),
  role: z.string().min(2),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
