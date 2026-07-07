import { prisma } from "@/lib/prisma";
import { withAuth, badRequest, ok } from "@/lib/api";
import { shareDocumentSchema } from "@/lib/validations";
import { notify } from "@/services/notifications";
import { canManage } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// POST — Share a document with another manager
export async function POST(
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
      uploadedBy: { select: { managerId: true } },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Only the engineer's manager can share
  if (auth.user.role === "MANAGER" && document.uploadedBy.managerId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden: not your engineer's document" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = shareDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  // Can't share with yourself
  if (parsed.data.sharedWithId === auth.user.id) {
    return badRequest("Cannot share a document with yourself");
  }

  // Validate target is a manager
  const target = await prisma.user.findUnique({
    where: { id: parsed.data.sharedWithId },
    select: { role: true, name: true },
  });
  if (!target || (target.role !== "MANAGER" && target.role !== "ADMIN")) {
    return badRequest("Can only share documents with managers");
  }

  // Check for existing share
  const existing = await prisma.documentShare.findUnique({
    where: {
      documentId_sharedWithId: {
        documentId: params.id,
        sharedWithId: parsed.data.sharedWithId,
      },
    },
  });
  if (existing) {
    return badRequest("Document already shared with this manager");
  }

  const share = await prisma.documentShare.create({
    data: {
      documentId: params.id,
      sharedById: auth.user.id,
      sharedWithId: parsed.data.sharedWithId,
      message: parsed.data.message ?? null,
    },
    include: {
      sharedWith: { select: { id: true, name: true } },
      document: { select: { title: true } },
    },
  });

  // Notify target manager
  await notify({
    userId: parsed.data.sharedWithId,
    title: "Document shared with you",
    message: `${auth.user.name ?? "A manager"} shared "${share.document.title}" with you.${parsed.data.message ? ` Note: ${parsed.data.message}` : ""}`,
    type: "DOCUMENT_SHARED",
    link: `/documents`,
  });

  return ok(share, 201);
}

// GET — List shares for a document
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  if (!canManage(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const shares = await prisma.documentShare.findMany({
    where: { documentId: params.id, sharedById: auth.user.id },
    include: {
      sharedWith: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(shares);
}

// DELETE — Revoke a share
export async function DELETE(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  if (!canManage(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get("shareId");
  if (!shareId) {
    return badRequest("shareId query parameter required");
  }

  const share = await prisma.documentShare.findUnique({
    where: { id: shareId },
  });

  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  if (share.sharedById !== auth.user.id && auth.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.documentShare.delete({ where: { id: shareId } });

  return ok({ success: true });
}
