"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function CommentBox({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    if (res.ok) {
      setContent("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment…"
      />
      <div className="flex justify-end">
        <Button onClick={submit} disabled={saving || !content.trim()} size="sm">
          {saving ? "Posting…" : "Comment"}
        </Button>
      </div>
    </div>
  );
}
