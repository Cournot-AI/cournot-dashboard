"use client";

import { useState, useEffect, useCallback } from "react";
import { IntelligenceFeedCard } from "@/components/intelligence/feed-card";
import { Pagination } from "@/components/intelligence/pagination";
import { PageLoading, PageError, PageEmpty } from "@/components/intelligence/loading-error";
import { DelayBadge } from "@/components/intelligence/badges";
import { VerticalBadge } from "@/components/intelligence/vertical-card";
import { fetchFeed, fetchVerticals, type FeedEvent, type VerticalInfo } from "@/lib/intelligence-api";

export default function FeedPage() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [vertical, setVertical] = useState("");
  const [eventType, setEventType] = useState("");
  const [verticals, setVerticals] = useState<VerticalInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    fetchVerticals().then((r) => setVerticals(r.verticals ?? [])).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchFeed({
        page_num: page,
        page_size: pageSize,
        vertical: vertical || undefined,
        event_type: eventType || undefined,
      });
      setEvents(res.events ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed");
    } finally {
      setIsLoading(false);
    }
  }, [page, vertical, eventType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">Intelligence Feed</h1>
            <DelayBadge />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Canonical events with top market impact previews. Public data is delayed by 15 minutes — <a href="/intelligence/premium" className="text-primary hover:underline">upgrade to Premium</a> for real-time access.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={vertical}
          onChange={(e) => { setVertical(e.target.value); setPage(1); }}
          className="h-8 rounded-lg border border-border bg-muted/30 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        >
          <option value="">All verticals</option>
          {verticals.map((v) => (
            <option key={v.vertical} value={v.vertical}>{v.vertical}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by event type..."
          value={eventType}
          onChange={(e) => { setEventType(e.target.value); setPage(1); }}
          className="h-8 rounded-lg border border-border bg-muted/30 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors w-48"
        />
        {(vertical || eventType) && (
          <button
            onClick={() => { setVertical(""); setEventType(""); setPage(1); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Active filters */}
      {vertical && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtered:</span>
          <VerticalBadge vertical={vertical} />
        </div>
      )}

      {/* Content */}
      {isLoading && events.length === 0 && !error && (
        <PageLoading message="Loading intelligence feed..." />
      )}

      {error && <PageError message={error} onRetry={loadData} />}

      {!isLoading && !error && events.length === 0 && (
        <PageEmpty title="No events" message="No canonical events match your filters." />
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
