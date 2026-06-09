"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

export function MarkAllReadButton({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={markAll} disabled={!hasUnread}>
      <CheckCheck className="h-4 w-4" />
      Mark all read
    </Button>
  );
}
