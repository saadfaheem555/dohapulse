import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { canManage, isAdmin } from "@/lib/session";
import { type Role } from "@prisma/client";

export type ApiUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  department: string | null;
};

/**
 * Ensures a request is authenticated. Returns either the user or a 401 response.
 */
export async function withAuth(): Promise<
  { user: ApiUser } | { response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user: user as ApiUser };
}

export function requireManager(user: ApiUser): NextResponse | null {
  if (!canManage(user.role)) {
    return NextResponse.json(
      { error: "Forbidden: manager role required" },
      { status: 403 }
    );
  }
  return null;
}

export function requireAdmin(user: ApiUser): NextResponse | null {
  if (!isAdmin(user.role)) {
    return NextResponse.json(
      { error: "Forbidden: admin role required" },
      { status: 403 }
    );
  }
  return null;
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
