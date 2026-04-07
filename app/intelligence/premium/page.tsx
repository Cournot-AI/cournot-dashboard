"use client";

import { Card, CardContent } from "@/components/ui/card";
import { RealTimeBadge } from "@/components/intelligence/badges";
import { Badge } from "@/components/ui/badge";
import { Zap, Radio, SlidersHorizontal, Mail } from "lucide-react";

export default function PremiumPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-bold tracking-tight">Premium Intelligence</h1>
          <RealTimeBadge />
          <Badge variant="outline" className="text-[10px] font-medium bg-violet-500/10 text-violet-400 border-violet-500/20">
            Coming Soon
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg">
          Real-time market impact intelligence for professional traders and partners. No 15-minute delay — see events and impacts as they happen.
        </p>
      </div>

      {/* Feature callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <Zap className="h-5 w-5 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold">Real-Time Impacts</h3>
            <p className="text-xs text-muted-foreground mt-1">No 15-minute delay. See market impacts as they happen across all verticals.</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <Radio className="h-5 w-5 text-sky-400 mb-2" />
            <h3 className="text-sm font-semibold">Source Freshness</h3>
            <p className="text-xs text-muted-foreground mt-1">Monitor source health and data recency across all intelligence verticals.</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <SlidersHorizontal className="h-5 w-5 text-violet-400 mb-2" />
            <h3 className="text-sm font-semibold">Advanced Filters</h3>
            <p className="text-xs text-muted-foreground mt-1">Filter by vertical, direction, impact type, and specific markets or events.</p>
          </CardContent>
        </Card>
      </div>

      {/* Waitlist CTA */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 max-w-lg mx-auto text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-3">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">Join the Waitlist</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Premium real-time intelligence is coming soon. Get early access by reaching out to us.
        </p>
        <a
          href="mailto:contact@cournot.ai?subject=Premium%20Intelligence%20Waitlist"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Mail className="h-3.5 w-3.5" />
          contact@cournot.ai
        </a>
      </div>
    </div>
  );
}
