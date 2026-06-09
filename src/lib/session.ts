import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { type Role } from "@prisma/client";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

const roleRank: Record<Role, number> = {
  ENGINEER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

/**
 * Returns true when the given role meets or exceeds the required role.
 */
export function hasRole(role: Role, required: Role): boolean {
  return roleRank[role] >= roleRank[required];
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export function canManage(role: Role): boolean {
  return roleRank[role] >= roleRank.MANAGER;
}
