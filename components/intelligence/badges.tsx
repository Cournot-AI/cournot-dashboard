"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Zap } from "lucide-react";

export function DelayBadge() {
  return (
    <Badge variant="outline" className="text-[10px] font-medium bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1">
      <Clock className="h-3 w-3" />
      15 min delayed
    </Badge>
  );
}

export function RealTimeBadge() {
  return (
    <Badge variant="outline" className="text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
      <Zap className="h-3 w-3" />
      Real-time
    </Badge>
  );
}

export function ImpactBadge({
  direction,
  impactType,
}: {
  direction: string;
  impactType?: string;
}) {
  const isPositive = direction.toLowerCase() === "up" || direction.toLowerCase() === "positive";
  const isNegative = direction.toLowerCase() === "down" || direction.toLowerCase() === "negative";

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-semibold gap-1",
        isPositive && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        isNegative && "bg-red-500/10 text-red-400 border-red-500/20",
        !isPositive && !isNegative && "bg-slate-500/10 text-slate-400 border-slate-500/20"
      )}
    >
      {isPositive ? "+" : isNegative ? "-" : "~"}
      {impactType && <span className="capitalize">{impactType}</span>}
    </Badge>
  );
}

export function EventTypeBadge({ eventType }: { eventType: string }) {
  return (
    <Badge variant="outline" className="text-[10px] font-medium bg-blue-500/10 text-blue-400 border-blue-500/20 capitalize">
      {eventType.replace(/_/g, " ")}
    </Badge>
  );
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-medium",
        isActive
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
      )}
    >
      {isActive ? "Active" : "Closed"}
    </Badge>
  );
}
