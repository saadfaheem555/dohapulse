import { prisma } from "@/lib/prisma";
import { withAuth, badRequest, ok } from "@/lib/api";
import { reviewDocumentSchema } from "@/lib/validations";
import { notify } from "@/services/notifications";
import { canManage } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      uploadedBy: { select: { id: true, name: true, department: true, managerId: true } },
      reviewer: { select: { id: true, name: true } },
      event: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      shares: {
        include: {
          sharedWith: { select: { id: true, name: true } },
          sharedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Access check: engineer can only see own docs, manager can see their engineers' docs or shared docs
  if (auth.user.role === "ENGINEER" && document.uploadedById !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (auth.user.role === "MANAGER") {
    const isOwnEngineer = document.uploadedBy.managerId === auth.user.id;
    const isSharedWithMe = document.shares.some((s) => s.sharedWithId === auth.user.id);
    if (!isOwnEngineer && !isSharedWithMe) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return ok(document);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  if (!canManage(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      uploadedBy: { select: { id: true, name: true, managerId: true } },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only the engineer's assigned manager can review
  if (auth.user.role === "MANAGER" && document.uploadedBy.managerId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden: not your engineer's document" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = reviewDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const updated = await prisma.document.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      reviewComment: parsed.data.reviewComment ?? null,
      reviewedById: auth.user.id,
      reviewedAt: new Date(),
    },
  });

  // Notify the engineer
  const notifType = parsed.data.status === "APPROVED" ? "DOCUMENT_REVIEWED" : "REVISION_REQUESTED";
  const notifTitle = parsed.data.status === "APPROVED"
    ? "Document approved"
    : "Document revision requested";
  const notifMessage = parsed.data.status === "APPROVED"
    ? `Your document "${document.title}" has been approved.`
    : `Revision requested for "${document.title}": ${parsed.data.reviewComment ?? "No comment"}`;

  await notify({
    userId: document.uploadedById,
    title: notifTitle,
    message: notifMessage,
    type: notifType,
    link: `/documents`,
  });

  return ok(updated);
}
