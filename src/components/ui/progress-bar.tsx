import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  color = "primary",
}: {
  value: number;
  className?: string;
  color?: "primary" | "green" | "orange";
}) {
  const colorClass = {
    primary: "bg-primary",
    green: "bg-emerald-500",
    orange: "bg-orange-500",
  }[color];

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", colorClass)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
