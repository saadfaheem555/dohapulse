import { prisma } from "@/lib/prisma";
import { withAuth, requireAdmin, badRequest, ok } from "@/lib/api";
import { createUserSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role");
  const department = searchParams.get("department");
  const status = searchParams.get("status");

  const users = await prisma.user.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { specialization: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        role ? { role: role as never } : {},
        department ? { department } : {},
        status ? { status: status as never } : {},
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      specialization: true,
      phone: true,
      status: true,
      _count: { select: { assignedTasks: true, assignments: true } },
    },
    orderBy: { name: "asc" },
  });

  return ok(users);
}

export async function POST(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const forbidden = requireAdmin(auth.user);
  if (forbidden) return forbidden;

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) {
    return badRequest("A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      department: data.department ?? null,
      specialization: data.specialization ?? null,
      phone: data.phone ?? null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: auth.user.id,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      details: `Created staff ${user.name}`,
    },
  });

  return ok(user, 201);
}
