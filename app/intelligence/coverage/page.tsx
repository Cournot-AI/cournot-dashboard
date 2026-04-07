"use client";

import { useState, useEffect, useCallback } from "react";
import { Pagination } from "@/components/intelligence/pagination";
import { PageLoading, PageError, PageEmpty } from "@/components/intelligence/loading-error";
import { VerticalBadge } from "@/components/intelligence/vertical-card";
import { fetchCatalog, fetchVerticals, type CatalogEntity, type VerticalInfo } from "@/lib/intelligence-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CoveragePage() {
  const [entities, setEntities] = useState<CatalogEntity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [vertical, setVertical] = useState("");
  const [verticals, setVerticals] = useState<VerticalInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 30;

  useEffect(() => {
    fetchVerticals().then((r) => setVerticals(r.verticals ?? [])).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchCatalog({
        page_num: page,
        page_size: pageSize,
        vertical: vertical || undefined,
      });
      setEntities(res.entities ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coverage data");
    } finally {
      setIsLoading(false);
    }
  }, [page, vertical]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Coverage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Entities and sources monitored across our intelligence verticals. {total > 0 && `${total.toLocaleString()} entities tracked.`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
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
        {vertical && (
          <button
            onClick={() => { setVertical(""); setPage(1); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading && entities.length === 0 && !error && (
        <PageLoading message="Loading coverage data..." />
      )}

      {error && <PageError message={error} onRetry={loadData} />}

      {!isLoading && !error && entities.length === 0 && (
        <PageEmpty title="No entities" message="No entities found for the selected filters." />
      )}

      {entities.length > 0 && (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Entity</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Type</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Vertical</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Events</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">First Seen</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entities.map((entity) => (
                  <TableRow key={entity.id} className="text-xs">
                    <TableCell className="font-medium">{entity.entity}</TableCell>
                    <TableCell>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground capitalize">
                        {entity.entity_type.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell><VerticalBadge vertical={entity.vertical} /></TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{entity.event_count}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{timeAgo(entity.first_seen)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{timeAgo(entity.last_seen)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
