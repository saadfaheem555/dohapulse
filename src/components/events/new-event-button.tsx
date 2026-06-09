"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NewEventForm } from "./new-event-form";
import { Plus } from "lucide-react";

export function NewEventButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Event
      </Button>
      {open && <NewEventForm onClose={() => setOpen(false)} />}
    </>
  );
}
