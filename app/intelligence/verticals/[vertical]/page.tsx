"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IntelligenceFeedCard } from "@/components/intelligence/feed-card";
import { Pagination } from "@/components/intelligence/pagination";
import { PageLoading, PageError, PageEmpty } from "@/components/intelligence/loading-error";
import { VerticalBadge } from "@/components/intelligence/vertical-card";
import { DelayBadge } from "@/components/intelligence/badges";
import { SummaryStatCard } from "@/components/intelligence/stat-card";
import { fetchVerticalFeed, fetchVerticals, type FeedEvent, type VerticalInfo } from "@/lib/intelligence-api";
import { ArrowLeft, Activity, Target } from "lucide-react";

export default function VerticalFeedPage() {
  const params = useParams();
  const vertical = decodeURIComponent(params.vertical as string);

  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState("");
  const [info, setInfo] = useState<VerticalInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    fetchVerticals()
      .then((r) => {
        const found = (r.verticals ?? []).find((v) => v.vertical === vertical);
        if (found) setInfo(found);
      })
      .catch(() => {});
  }, [vertical]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchVerticalFeed({
        vertical,
        page_num: page,
        page_size: pageSize,
        event_type: eventType || undefined,
      });
      setEvents(res.events ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vertical feed");
    } finally {
      setIsLoading(false);
    }
  }, [vertical, page, eventType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div>
        <Link
          href="/intelligence/verticals"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> All verticals
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight capitalize">{vertical}</h1>
          <VerticalBadge vertical={vertical} />
          <DelayBadge />
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Intelligence feed for the {vertical} vertical.
        </p>
      </div>

      {/* Stats */}
      {info && (
        <div className="grid grid-cols-2 gap-3">
          <SummaryStatCard label="Markets" value={info.markets_count ?? 0} icon={Target} color="text-sky-400" />
          <SummaryStatCard label="Events" value={info.events_count ?? 0} icon={Activity} color="text-emerald-400" />
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Filter by event type..."
          value={eventType}
          onChange={(e) => { setEventType(e.target.value); setPage(1); }}
          className="h-8 rounded-lg border border-border bg-muted/30 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors w-48"
        />
        {eventType && (
          <button
            onClick={() => { setEventType(""); setPage(1); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading && events.length === 0 && !error && (
        <PageLoading message={`Loading ${vertical} feed...`} />
      )}

      {error && <PageError message={error} onRetry={loadData} />}

      {!isLoading && !error && events.length === 0 && (
        <PageEmpty title="No events" message={`No events in the ${vertical} vertical yet.`} />
      )}

      {events.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {events.map((event) => (
              <IntelligenceFeedCard key={event.canonical_event_id} event={event} />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
