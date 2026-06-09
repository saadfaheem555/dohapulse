import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  phaseLabels,
  phaseStatusColors,
  phaseStatusLabels,
  PHASE_ORDER,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { type EventPhase, type PhaseName } from "@prisma/client";

export function PhaseTimeline({
  phases,
  currentPhase,
}: {
  phases: EventPhase[];
  currentPhase: PhaseName;
}) {
  const ordered = [...phases].sort(
    (a, b) => PHASE_ORDER.indexOf(a.name) - PHASE_ORDER.indexOf(b.name)
  );

  return (
    <div className="space-y-4">
      {/* Horizontal stepper */}
      <div className="flex items-center overflow-x-auto thin-scroll pb-2">
        {ordered.map((p, i) => {
          const isCurrent = p.name === currentPhase;
          const isDone = p.status === "COMPLETED";
          return (
            <div key={p.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold",
                    isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground"
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    "mt-2 whitespace-nowrap text-xs font-medium",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {phaseLabels[p.name]}
                </span>
              </div>
              {i < ordered.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1",
                    isDone ? "bg-emerald-500" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Phase detail rows */}
      <div className="space-y-3">
        {ordered.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{phaseLabels[p.name]}</span>
                <Badge color={phaseStatusColors[p.status]}>
                  {phaseStatusLabels[p.status]}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(p.startDate)} – {formatDate(p.endDate)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar
                value={p.progress}
                color={p.progress === 100 ? "green" : "primary"}
              />
              <span className="w-10 text-right text-xs font-medium text-muted-foreground">
                {p.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
