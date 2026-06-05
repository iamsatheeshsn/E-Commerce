"use client";

import { LucideIcon } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  isCurrency?: boolean;
  accent?: "primary" | "accent" | "emerald" | "amber" | "cyan";
}

const accentStyles = {
  primary: "from-primary/15 to-primary/5 text-primary",
  accent: "from-accent/15 to-accent/5 text-accent",
  emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600",
  amber: "from-amber-500/15 to-amber-500/5 text-amber-600",
  cyan: "from-cyan-500/15 to-cyan-500/5 text-cyan-600",
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  isCurrency,
  accent = "primary",
}: StatsCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <div className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">
            {isCurrency ? formatPrice(value) : value.toLocaleString()}
          </p>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br",
            accentStyles[accent]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
