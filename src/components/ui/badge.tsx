import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeColor =
  | "gray"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "purple"
  | "orange";

const colorClasses: Record<BadgeColor, string> = {
  gray: "bg-secondary text-secondary-foreground",
  blue: "bg-sky-100 text-sky-800",
  green: "bg-emerald-100 text-emerald-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  purple: "bg-violet-100 text-violet-800",
  orange: "bg-orange-100 text-orange-800",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export function Badge({ className, color = "gray", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClasses[color],
        className
      )}
      {...props}
    />
  );
}
