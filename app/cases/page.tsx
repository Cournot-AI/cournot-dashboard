"use client";

import { useState, useEffect, useCallback } from "react";
import { CaseTableView } from "@/components/cases/case-table";
import { defaultFilters, type FilterState } from "@/components/cases/case-filters";
import { fetchEvents } from "@/lib/api";
import type { MarketCase } from "@/lib/types";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { trackCasesPageView, trackCasesFilterChange } from "@/lib/analytics";

export default function CasesPage() {
  const [cases, setCases] = useState<MarketCase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiFilters: { source?: string; match_result?: string } = {};
      if (filters.source !== "ALL") apiFilters.source = filters.source;
      if (filters.matchResult !== "ALL") apiFilters.match_result = filters.matchResult;

      const result = await fetchEvents(page, pageSize, apiFilters);
      setCases(result.cases);
      setTotal(result.total);
      trackCasesPageView(page, pageSize, filters.source, filters.matchResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters.source, filters.matchResult]);

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

  const handleFiltersChange = (newFilters: FilterState) => {
    if (newFilters.source !== filters.source) {
      trackCasesFilterChange("source", newFilters.source);
    }
    if (newFilters.matchResult !== filters.matchResult) {
      trackCasesFilterChange("match_result", newFilters.matchResult);
    }
    if (newFilters.needsAttention !== filters.needsAttention) {
      trackCasesFilterChange("needs_attention", String(newFilters.needsAttention));
    }
    setFilters(newFilters);
    // Reset to first page when filters change (source/match are server-side)
    if (newFilters.source !== filters.source || newFilters.matchResult !== filters.matchResult) {
      setPage(1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Cases</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse market cases — compare official source outcomes vs AI Oracle results
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
            <p className="text-sm font-medium text-red-400">Failed to load events</p>
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
      {isLoading && cases.length === 0 && !error && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            <p className="text-sm text-muted-foreground">Loading events...</p>
          </div>
        </div>
      )}

      {/* Table with data */}
      {(cases.length > 0 || (!isLoading && !error)) && (
        <CaseTableView
          cases={cases}
          filters={filters}
          onFiltersChange={handleFiltersChange}
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
