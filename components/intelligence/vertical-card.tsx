"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

const verticalColors: Record<string, string> = {
  geopolitics: "bg-red-500/10 text-red-400 border-red-500/20",
  sports: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  crypto: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  news: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  weather: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  politics: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  finance: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  science: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  entertainment: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  technology: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

const defaultVerticalColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";

export function getVerticalColor(vertical: string): string {
  return verticalColors[vertical.toLowerCase()] ?? defaultVerticalColor;
}

export function VerticalBadge({ vertical }: { vertical: string }) {
  return (
    <Badge variant="outline" className={`text-[11px] font-medium capitalize ${getVerticalColor(vertical)}`}>
      {vertical}
    </Badge>
  );
}

export function VerticalCard({
  vertical,
  marketCount = 0,
  eventCount = 0,
  impactCount,
}: {
  vertical: string;
  marketCount?: number;
  eventCount?: number;
  impactCount?: number;
}) {
  return (
    <Link href={`/intelligence/verticals/${encodeURIComponent(vertical)}`}>
      <Card className="border-border/50 transition-all hover:border-primary/30 hover:bg-accent/20 cursor-pointer group">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-start justify-between">
            <div>
              <VerticalBadge vertical={vertical} />
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span><span className="font-semibold text-foreground">{(marketCount ?? 0).toLocaleString()}</span> markets</span>
                <span><span className="font-semibold text-foreground">{(eventCount ?? 0).toLocaleString()}</span> events</span>
                {impactCount != null && (
                  <span><span className="font-semibold text-foreground">{impactCount.toLocaleString()}</span> impacts</span>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
