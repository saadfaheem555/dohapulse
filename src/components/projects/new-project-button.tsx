"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewProjectForm } from "./new-project-form";

type Manager = { id: string; name: string };
type Event = { id: string; name: string };

export function NewProjectButton({
  managers,
  events,
  isAdmin,
}: {
  managers: Manager[];
  events: Event[];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" /> New Project
      </Button>
      {open && (
        <NewProjectForm
          onClose={() => setOpen(false)}
          managers={managers}
          events={events}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}
