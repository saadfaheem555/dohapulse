"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Manager = { id: string; name: string };

export function ManagerAssignment({
  staffId,
  currentManagerId,
}: {
  staffId: string;
  currentManagerId: string | null;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selected, setSelected] = useState(currentManagerId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/staff?role=MANAGER")
      .then((r) => r.json())
      .then((data) => setManagers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isAdmin]);

  if (!isAdmin) return null;

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: selected || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to assign manager");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to assign manager");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 border-t border-border pt-4">
      <h3 className="mb-2 text-sm font-semibold">Assign Manager</h3>
      <div className="flex items-center gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">No manager</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
