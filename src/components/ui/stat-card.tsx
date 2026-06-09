import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  hint,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  hint?: string;
  accent?: "primary" | "green" | "orange" | "red" | "purple";
}) {
  const accentClasses = {
    primary: "bg-sky-100 text-sky-700",
    green: "bg-emerald-100 text-emerald-700",
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-violet-100 text-violet-700",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            accentClasses[accent]
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
