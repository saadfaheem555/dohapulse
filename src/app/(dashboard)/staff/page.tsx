import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaffToolbar } from "@/components/staff/staff-toolbar";
import { getInitials } from "@/lib/utils";
import { roleLabels, roleColors } from "@/lib/labels";
import { type Prisma, type Role, type UserStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const statusColor: Record<UserStatus, "green" | "gray" | "yellow"> = {
  ACTIVE: "green",
  INACTIVE: "gray",
  PENDING: "yellow",
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string; status?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const where: Prisma.UserWhereInput = {
    AND: [
      searchParams.q
        ? {
            OR: [
              { name: { contains: searchParams.q, mode: "insensitive" } },
              { email: { contains: searchParams.q, mode: "insensitive" } },
              {
                specialization: {
                  contains: searchParams.q,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {},
      searchParams.role ? { role: searchParams.role as Role } : {},
      searchParams.status
        ? { status: searchParams.status as UserStatus }
        : {},
    ],
  };

  const staff = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      specialization: true,
      status: true,
      _count: { select: { assignedTasks: true, assignments: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Staff & Engineers"
        description="Registered personnel available for event operations and assignments."
      />

      <StaffToolbar canCreate={isAdmin(user.role)} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Specialization</th>
                <th className="px-4 py-3 font-medium">Tasks</th>
                <th className="px-4 py-3 font-medium">Assignments</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No staff found.
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/staff/${s.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                          {getInitials(s.name)}
                        </span>
                        <span>
                          <span className="block font-medium text-foreground">
                            {s.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {s.email}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={roleColors[s.role]}>
                        {roleLabels[s.role]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.department ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.specialization ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s._count.assignedTasks}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s._count.assignments}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={statusColor[s.status]}>{s.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
