import { prisma } from "@/lib/prisma";
import { withAuth, badRequest, ok } from "@/lib/api";
import { createDocumentSchema } from "@/lib/validations";
import { notifyManager } from "@/services/notifications";
import { canManage } from "@/lib/session";
import { NextRequest } from "next/server";
import { type Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const status = searchParams.get("status");

  let where: Prisma.DocumentWhereInput = {};

  if (auth.user.role === "ENGINEER") {
    // Engineers see only their own documents
    where = { uploadedById: auth.user.id };
  } else if (auth.user.role === "MANAGER") {
    // Managers see documents from their assigned engineers
    where = {
      uploadedBy: { managerId: auth.user.id },
    };
  }
  // Admins see all documents (where stays {})

  if (eventId) where.eventId = eventId;
  if (status) where.status = status as never;

  const documents = await prisma.document.findMany({
    where,
    include: {
      uploadedBy: { select: { id: true, name: true, department: true } },
      reviewer: { select: { id: true, name: true } },
      event: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(documents);
}

export async function POST(req: NextRequest) {
  const auth = await withAuth();
  if ("response" in auth) return auth.response;

  // Only engineers upload documents
  if (canManage(auth.user.role)) {
    return badRequest("Only engineers can upload documents");
  }

  const body = await req.json();
  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  const d = parsed.data;

  // Validate allowed mime types
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(d.mimeType)) {
    return badRequest("File type not allowed. Allowed: PDF, DOCX, XLSX, PNG, JPEG, GIF, WEBP");
  }

  // Verify engineer is assigned to this event
  const assignment = await prisma.staffAssignment.findFirst({
    where: { userId: auth.user.id, eventId: d.eventId },
  });
  if (!assignment) {
    return badRequest("You are not assigned to this event");
  }

  const document = await prisma.document.create({
    data: {
      title: d.title,
      description: d.description ?? null,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      uploadedById: auth.user.id,
      eventId: d.eventId,
      taskId: d.taskId ?? null,
    },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      event: { select: { id: true, name: true } },
    },
  });

  // Notify the engineer's manager
  await notifyManager(auth.user.id, {
    title: "New document uploaded",
    message: `${auth.user.name ?? "An engineer"} uploaded "${document.title}"`,
    type: "DOCUMENT_UPLOADED",
    link: `/documents`,
  });

  return ok(document, 201);
}
