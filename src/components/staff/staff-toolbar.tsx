"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { NewStaffForm } from "./new-staff-form";
import { Plus, Search } from "lucide-react";

export function StaffToolbar({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/staff?${params.toString()}`);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, specialization…"
            defaultValue={searchParams.get("q") ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                updateParam("q", (e.target as HTMLInputElement).value);
            }}
            className="pl-9"
          />
        </div>
        <Select
          defaultValue={searchParams.get("role") ?? ""}
          onChange={(e) => updateParam("role", e.target.value)}
          className="w-44"
        >
          <option value="">All roles</option>
          <option value="ADMIN">Administrator</option>
          <option value="MANAGER">Manager</option>
          <option value="ENGINEER">Engineer / Staff</option>
        </Select>
        <Select
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => updateParam("status", e.target.value)}
          className="w-40"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
        </Select>
        {canCreate && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        )}
      </div>

      {open && <NewStaffForm onClose={() => setOpen(false)} />}
    </>
  );
}
