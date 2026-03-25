"use client";

import { useState, useEffect, useCallback } from "react";
import { MonitoringTable } from "@/components/monitoring/monitoring-table";
import { fetchMonitoringEvents } from "@/lib/api";
import type { MonitoringEvent } from "@/lib/api";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MonitoringPage() {
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchMonitoringEvents(page, pageSize);
      setEvents(result.events);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load monitoring events");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Monitoring</h1>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
            >
              Autonomous
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            OpenClaw autonomous market monitoring — active resolution detection
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Failed to load monitoring events</p>
            <p className="text-xs text-red-400/70 mt-1">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Loading state (initial load) */}
      {isLoading && events.length === 0 && !error && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="text-sm text-muted-foreground">Loading monitoring events...</p>
          </div>
        </div>
      )}

      {/* Table with data */}
      {(events.length > 0 || (!isLoading && !error)) && (
        <MonitoringTable
          events={events}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
            isLoading,
          }}
        />
      )}
    </div>
  );
}
