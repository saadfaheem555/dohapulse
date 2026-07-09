"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteStaffButton({ staffId, staffName }: { staffId: string; staffName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/staff/${staffId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/staff");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete staff member");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Are you sure you want to deactivate <strong>{staffName}</strong>? This will revoke their access.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Removing…" : "Confirm"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
      Remove Staff
    </button>
  );
}
