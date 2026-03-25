"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DiscoveredSource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Globe, ExternalLink } from "lucide-react";

const relevanceStyles: Record<string, { color: string; bg: string }> = {
  high: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  low: { color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
};

export function DiscoveredSourcesCard({
  sources,
}: {
  sources: DiscoveredSource[];
}) {
  if (sources.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-sky-400" />
          <CardTitle className="text-sm">
            Discovered Sources
          </CardTitle>
          <Badge
            variant="outline"
            className="text-[10px] ml-auto text-sky-400 border-sky-500/20 bg-sky-500/10"
          >
            {sources.length} found at resolve time
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sources.map((s, i) => {
          const style = relevanceStyles[s.relevance] ?? relevanceStyles.medium;
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium truncate">{s.title}</p>
                  <Badge
                    variant="outline"
                    className={cn("text-[9px] shrink-0 capitalize", style.bg, style.color)}
                  >
                    {s.relevance}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  {s.url}
                </p>
              </div>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
