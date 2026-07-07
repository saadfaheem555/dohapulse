"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { documentStatusLabels, documentStatusColors } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { type DocumentStatus } from "@prisma/client";
import { Upload, FileText, Download, Share2, CheckCircle, RotateCcw, X } from "lucide-react";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { DocumentShareModal } from "@/components/documents/document-share-modal";
import { DocumentReviewModal } from "@/components/documents/document-review-modal";

type Document = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  reviewComment: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string; department: string | null };
  reviewer: { id: string; name: string } | null;
  event: { id: string; name: string };
  task: { id: string; title: string } | null;
};

type SharedDocument = {
  id: string;
  message: string | null;
  createdAt: string;
  sharedBy: { id: string; name: string };
  document: Document;
};

export default function DocumentsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const role = user?.role;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<"my" | "shared">("my");
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [reviewDoc, setReviewDoc] = useState<Document | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/documents");
    if (res.ok) setDocuments(await res.json());
    setLoading(false);
  }, []);

  const fetchShared = useCallback(async () => {
    const res = await fetch("/api/documents/shared");
    if (res.ok) setSharedDocs(await res.json());
  }, []);

  useEffect(() => {
    fetchDocuments();
    if (role === "MANAGER" || role === "ADMIN") {
      fetchShared();
    }
  }, [fetchDocuments, fetchShared, role]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isManager = role === "MANAGER" || role === "ADMIN";

  return (
    <div>
      <PageHeader
        title="Documents"
        description={
          role === "ENGINEER"
            ? "Upload and manage your project documents"
            : "Review and manage documents from your engineers"
        }
      >
        {role === "ENGINEER" && (
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        )}
      </PageHeader>

      {showUpload && (
        <DocumentUploadForm
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            fetchDocuments();
          }}
        />
      )}

      {isManager && (
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("my")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "my"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {role === "MANAGER" ? "My Engineers' Documents" : "All Documents"}
          </button>
          <button
            onClick={() => setActiveTab("shared")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "shared"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Shared with Me
          </button>
        </div>
      )}

      {activeTab === "my" && (
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No documents yet.</p>
              </CardContent>
            </Card>
          ) : (
            documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="flex items-start justify-between py-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{doc.title}</h3>
                      <Badge color={documentStatusColors[doc.status]}>
                        {documentStatusLabels[doc.status]}
                      </Badge>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>{doc.fileName}</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>{doc.event.name}</span>
                      {doc.task && <span>Task: {doc.task.title}</span>}
                      {isManager && <span>By: {doc.uploadedBy.name}</span>}
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                    {doc.reviewComment && (
                      <div className="mt-2 rounded-md bg-secondary/50 p-2 text-sm">
                        <span className="font-medium">Review comment: </span>
                        {doc.reviewComment}
                        {doc.reviewer && (
                          <span className="text-muted-foreground"> — {doc.reviewer.name}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                    {isManager && doc.uploadedBy.id !== user?.id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewDoc(doc)}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShareDoc(doc)}
                        >
                          <Share2 className="mr-1 h-4 w-4" />
                          Share
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "shared" && isManager && (
        <div className="space-y-4">
          {sharedDocs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Share2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No documents have been shared with you.
                </p>
              </CardContent>
            </Card>
          ) : (
            sharedDocs.map((share) => (
              <Card key={share.id}>
                <CardContent className="flex items-start justify-between py-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{share.document.title}</h3>
                      <Badge color={documentStatusColors[share.document.status]}>
                        {documentStatusLabels[share.document.status]}
                      </Badge>
                    </div>
                    {share.document.description && (
                      <p className="text-sm text-muted-foreground">
                        {share.document.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>{share.document.fileName}</span>
                      <span>{formatFileSize(share.document.fileSize)}</span>
                      <span>{share.document.event.name}</span>
                      <span>Uploaded by: {share.document.uploadedBy.name}</span>
                      <span>Shared by: {share.sharedBy.name}</span>
                      <span>{formatDate(share.createdAt)}</span>
                    </div>
                    {share.message && (
                      <div className="mt-2 rounded-md bg-secondary/50 p-2 text-sm">
                        <span className="font-medium">Note: </span>
                        {share.message}
                      </div>
                    )}
                  </div>
                  <a
                    href={share.document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {shareDoc && (
        <DocumentShareModal
          document={shareDoc}
          onClose={() => setShareDoc(null)}
          onSuccess={() => {
            setShareDoc(null);
            fetchDocuments();
          }}
        />
      )}

      {reviewDoc && (
        <DocumentReviewModal
          document={reviewDoc}
          onClose={() => setReviewDoc(null)}
          onSuccess={() => {
            setReviewDoc(null);
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
}
