"use client";

import { useState, useEffect, useCallback } from "react";
import { VerticalCard } from "@/components/intelligence/vertical-card";
import { PageLoading, PageError, PageEmpty } from "@/components/intelligence/loading-error";
import { fetchVerticals, type VerticalInfo } from "@/lib/intelligence-api";

export default function VerticalsPage() {
  const [verticals, setVerticals] = useState<VerticalInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchVerticals();
      setVerticals(res.verticals ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load verticals");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <PageLoading message="Loading verticals..." />;
  if (error) return <PageError message={error} onRetry={loadData} />;
  if (verticals.length === 0) return <PageEmpty title="No verticals" message="No intelligence verticals available." />;

  const totalMarkets = verticals.reduce((s, v) => s + (v.markets_count ?? 0), 0);
  const totalEvents = verticals.reduce((s, v) => s + (v.events_count ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Verticals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {verticals.length} verticals covering {totalMarkets.toLocaleString()} markets and {totalEvents.toLocaleString()} canonical events.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {verticals.map((v) => (
          <VerticalCard
            key={v.vertical}
            vertical={v.vertical}
            marketCount={v.markets_count}
            eventCount={v.events_count}
          />
        ))}
      </div>
    </div>
  );
}
