"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SummaryStatCard } from "@/components/intelligence/stat-card";
import { VerticalCard } from "@/components/intelligence/vertical-card";
import { IntelligenceFeedCard } from "@/components/intelligence/feed-card";
import { PageLoading, PageError } from "@/components/intelligence/loading-error";
import { DelayBadge } from "@/components/intelligence/badges";
import {
  fetchOverview,
  fetchFeed,
  fetchVerticals,
  type OverviewData,
  type FeedEvent,
  type VerticalInfo,
} from "@/lib/intelligence-api";
import {
  Globe,
  Activity,
  Layers,
  Zap,
  ArrowRight,
  Target,
  BarChart3,
} from "lucide-react";

export default function IntelligencePage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [verticals, setVerticals] = useState<VerticalInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ov, fd, vt] = await Promise.all([
        fetchOverview(),
        fetchFeed({ page_num: 1, page_size: 6 }),
        fetchVerticals(),
      ]);
      setOverview(ov);
      setFeed(fd.events ?? []);
      setVerticals(vt.verticals ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load intelligence data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <PageLoading message="Loading intelligence overview..." />;
  if (error) return <PageError message={error} onRetry={loadData} />;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Intelligence</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Real-world events mapped to prediction markets. Our intelligence layer tracks canonical events across multiple verticals, identifies market impacts, and delivers actionable signals.
        </p>
      </div>

      {/* Summary stats */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryStatCard
            label="Verticals"
            value={overview.total_verticals ?? 0}
            icon={Globe}
            color="text-violet-400"
          />
          <SummaryStatCard
            label="Markets Tracked"
            value={overview.total_markets ?? 0}
            icon={Target}
            color="text-sky-400"
          />
          <SummaryStatCard
            label="Canonical Events"
            value={overview.total_canonical_events ?? 0}
            icon={Activity}
            color="text-emerald-400"
          />
          <SummaryStatCard
            label="Market Impacts"
            value={overview.total_impacts ?? 0}
            icon={BarChart3}
            color="text-amber-400"
          />
        </div>
      )}

      {/* Verticals */}
      {verticals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Verticals</h2>
              <p className="text-xs text-muted-foreground">Coverage across {verticals.length} intelligence verticals</p>
            </div>
            <Link
              href="/intelligence/verticals"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {verticals.slice(0, 6).map((v) => (
              <VerticalCard
                key={v.vertical}
                vertical={v.vertical}
                marketCount={v.markets_count}
                eventCount={v.events_count}
              />
            ))}
          </div>
        </div>
      )}

      {/* Latest intelligence feed */}
      {feed.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-semibold">Latest Intelligence</h2>
                <p className="text-xs text-muted-foreground">Recent canonical events and their market impacts</p>
              </div>
              <DelayBadge />
            </div>
            <Link
              href="/intelligence/feed"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Full feed <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {feed.map((event) => (
              <IntelligenceFeedCard key={event.canonical_event_id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Premium CTA */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Premium Real-Time Intelligence</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-lg">
              Public data is intentionally delayed by 15 minutes. Premium subscribers get real-time impact feeds, source freshness monitoring, and advanced filtering for professional trading workflows.
            </p>
            <Link
              href="/intelligence/premium"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Layers className="h-3.5 w-3.5" />
              Access Premium
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
