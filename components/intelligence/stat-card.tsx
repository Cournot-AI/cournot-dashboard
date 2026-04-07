"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function SummaryStatCard({
  label,
  value,
  icon: Icon,
  color = "text-foreground",
  subtitle,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
  subtitle?: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className={cn("text-2xl font-bold tabular-nums mt-0.5", color)}>
              {typeof value === "number" ? (value ?? 0).toLocaleString() : (value ?? "—")}
            </p>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
