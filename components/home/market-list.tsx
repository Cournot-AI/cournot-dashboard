"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchMarketsPublic } from "@/lib/admin-api";
import type { AdminMarket } from "@/lib/types";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type SortField = "created_time" | "end_time" | "start_time" | "expected_resolve_time" | "updated_time";

const SORT_OPTIONS: { label: string; value: SortField }[] = [
  { label: "Recently Updated", value: "updated_time" },
  { label: "Expected Resolve", value: "expected_resolve_time" },
  { label: "Newest", value: "created_time" },
  { label: "End Time", value: "end_time" },
  { label: "Start Time", value: "start_time" },
];

type SourceFilter = string | "all";

const SOURCE_OPTIONS: { label: string; value: SourceFilter }[] = [
  { label: "All", value: "all" },
  { label: "Polymarket", value: "polymarket" },
  { label: "Limitless", value: "limitless" },
  { label: "Myriad", value: "myriad" },
  { label: "PredictFun", value: "predictfun" },
];

type MarketTypeFilter = string | "all";

const MARKET_TYPE_OPTIONS: { label: string; value: MarketTypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Event Based", value: "event_based" },
  { label: "Time Based", value: "time_based" },
];

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function MarketList({ status }: { status: "resolved" | "monitoring" }) {
  const router = useRouter();
  const [markets, setMarkets] = useState<AdminMarket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const defaultSort: SortField = status === "monitoring" ? "expected_resolve_time" : "updated_time";
  const [sort, setSort] = useState<SortField>(defaultSort);
  const order = status === "monitoring" ? "asc" as const : "desc" as const;
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [marketTypeFilter, setMarketTypeFilter] = useState<MarketTypeFilter>("all");
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMarketsPublic({
        page_num: page,
        page_size: pageSize,
        sort,
        order,
        status,
        source: sourceFilter === "all" ? undefined : sourceFilter,
        market_timing_type: marketTypeFilter === "all" ? undefined : marketTypeFilter,
      });
      setMarkets(data.markets ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // Error handled by admin-api
    } finally {
      setLoading(false);
    }
  }, [status, sort, order, page, sourceFilter, marketTypeFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Filter row: sort, source, market type */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Sort</span>
          <div className="flex gap-1 rounded-lg bg-muted/30 p-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSort(opt.value); setPage(1); }}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  sort === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Source</span>
          <div className="flex gap-1 rounded-lg bg-muted/30 p-1">
            {SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSourceFilter(opt.value); setPage(1); }}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  sourceFilter === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Type</span>
          <div className="flex gap-1 rounded-lg bg-muted/30 p-1">
            {MARKET_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setMarketTypeFilter(opt.value); setPage(1); }}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  marketTypeFilter === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>AI Outcome</TableHead>
                {status === "monitoring" ? (
                  <TableHead>Expected Resolve</TableHead>
                ) : (
                  <TableHead>Updated</TableHead>
                )}
                <TableHead>End Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : markets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No markets found
                  </TableCell>
                </TableRow>
              ) : (
                markets.map((m) => (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/markets/${m.id}`)}
                  >
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {m.id}
                    </TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {m.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {m.source || "—"}
                    </TableCell>
                    <TableCell>
                      {m.ai_outcome ? (
                        <span className="font-semibold">{m.ai_outcome}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(status === "monitoring" ? m.expected_resolve_time : m.updated_time)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(m.end_time)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} markets total</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
