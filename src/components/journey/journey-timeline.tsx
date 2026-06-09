import { formatDate } from "@/lib/utils";
import { phaseLabels, PHASE_ORDER } from "@/lib/labels";
import { type EventPhase, type PhaseName } from "@prisma/client";

const phaseColors: Record<PhaseName, string> = {
  BIDDING: "bg-slate-400",
  PLANNING: "bg-sky-500",
  CONSTRUCTION: "bg-amber-500",
  TESTING: "bg-violet-500",
  READINESS: "bg-orange-500",
  GAMES_TIME: "bg-emerald-500",
  LEGACY: "bg-teal-600",
};

export function JourneyTimeline({
  phases,
  currentPhase,
  eventStart,
  eventEnd,
}: {
  phases: EventPhase[];
  currentPhase: PhaseName;
  eventStart: Date;
  eventEnd: Date;
}) {
  const start = new Date(eventStart).getTime();
  const end = new Date(eventEnd).getTime();
  const span = Math.max(end - start, 1);

  const ordered = [...phases].sort(
    (a, b) => PHASE_ORDER.indexOf(a.name) - PHASE_ORDER.indexOf(b.name)
  );

  // Year gridlines
  const years: { label: string; offset: number }[] = [];
  const cursor = new Date(eventStart);
  cursor.setMonth(0, 1);
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= end) {
    if (cursor.getTime() >= start) {
      years.push({
        label: String(cursor.getFullYear()),
        offset: ((cursor.getTime() - start) / span) * 100,
      });
    }
    cursor.setFullYear(cursor.getFullYear() + 1);
  }

  const nowOffset =
    Date.now() >= start && Date.now() <= end
      ? ((Date.now() - start) / span) * 100
      : null;

  return (
    <div>
      {/* Year axis */}
      <div className="relative mb-1 h-5">
        {years.map((y, i) => (
          <div
            key={i}
            className="absolute top-0 border-l border-border pl-1 text-[11px] text-muted-foreground"
            style={{ left: `${y.offset}%` }}
          >
            {y.label}
          </div>
        ))}
      </div>

      {/* Phase track */}
      <div className="relative h-12 overflow-hidden rounded-lg border border-border bg-secondary/30">
        {ordered.map((p) => {
          const pStart = new Date(p.startDate).getTime();
          const pEnd = new Date(p.endDate).getTime();
          const left = ((pStart - start) / span) * 100;
          const width = ((pEnd - pStart) / span) * 100;
          const isCurrent = p.name === currentPhase;
          return (
            <div
              key={p.id}
              title={`${phaseLabels[p.name]} · ${formatDate(p.startDate)} → ${formatDate(p.endDate)} · ${p.progress}%`}
              className={`absolute top-0 flex h-full items-center justify-center overflow-hidden text-[11px] font-medium text-white ${phaseColors[p.name]} ${isCurrent ? "ring-2 ring-inset ring-black/30" : ""}`}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span className="truncate px-1">{phaseLabels[p.name]}</span>
            </div>
          );
        })}

        {/* "Now" marker */}
        {nowOffset !== null && (
          <div
            className="absolute top-0 z-10 h-full w-0.5 bg-red-600"
            style={{ left: `${nowOffset}%` }}
            title="Today"
          >
            <span className="absolute -top-0 left-1 text-[10px] font-semibold text-red-600">
              now
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {ordered.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5 text-xs">
            <span
              className={`inline-block h-3 w-3 rounded-sm ${phaseColors[p.name]}`}
            />
            <span className="text-muted-foreground">
              {phaseLabels[p.name]} ({p.progress}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
