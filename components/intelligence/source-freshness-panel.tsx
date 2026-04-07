"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SourceFreshness } from "@/lib/intelligence-api";
import { Radio } from "lucide-react";

function freshnessColor(lastFetched: string): string {
  const diff = Date.now() - new Date(lastFetched).getTime();
  const mins = diff / 60000;
  if (mins < 5) return "text-emerald-400";
  if (mins < 30) return "text-sky-400";
  if (mins < 120) return "text-amber-400";
  return "text-red-400";
}

function freshnessLabel(lastFetched: string): string {
  const diff = Date.now() - new Date(lastFetched).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "< 1m";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function SourceFreshnessPanel({
  sources,
}: {
  sources: SourceFreshness[];
}) {
  if (!sources.length) return null;

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Source Freshness</h3>
        </div>
        <div className="space-y-2">
          {sources.map((s) => (
            <div key={s.source_name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 rounded-full", freshnessColor(s.last_fetched).replace("text-", "bg-"))} />
                <span className="font-medium">{s.source_name}</span>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {s.vertical}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>{s.event_count} events</span>
                <span className={cn("font-mono tabular-nums", freshnessColor(s.last_fetched))}>
                  {freshnessLabel(s.last_fetched)} ago
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
