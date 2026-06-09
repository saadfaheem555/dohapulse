"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";

export function EventSelect({
  events,
  selected,
  basePath,
}: {
  events: { id: string; name: string }[];
  selected?: string;
  basePath: string;
}) {
  const router = useRouter();
  return (
    <Select
      value={selected ?? ""}
      onChange={(e) =>
        router.push(
          e.target.value ? `${basePath}?eventId=${e.target.value}` : basePath
        )
      }
      className="w-64"
    >
      {events.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {ev.name}
        </option>
      ))}
    </Select>
  );
}
