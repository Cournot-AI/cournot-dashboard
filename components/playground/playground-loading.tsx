"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface PlaygroundLoadingProps {
  phase: "prompting" | "resolving";
}

export function PlaygroundLoading({ phase }: PlaygroundLoadingProps) {
  const label = phase === "prompting" ? "Generating prompt spec..." : "Resolving market...";

  return (
    <Card className="border-border/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Animated gradient bar */}
      <div className="h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500 animate-pulse" />
      <CardContent className="pt-5 pb-5 space-y-5">
        {/* Status */}
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>

        {/* 3-column skeleton grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-muted/20 p-4 space-y-3"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-3 w-16 mt-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
