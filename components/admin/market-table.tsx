"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role";
import { fetchMarkets } from "@/lib/admin-api";
import type { AdminMarket, AdminMarketStatus } from "@/lib/types";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SortField = "created_time" | "end_time" | "start_time" | "expected_resolve_time" | "updated_time";

const SORT_OPTIONS: { label: string; value: SortField }[] = [
  { label: "Expected Resolve", value: "expected_resolve_time" },
  { label: "Recently Updated", value: "updated_time" },
  { label: "Newest", value: "created_time" },
  { label: "End Time", value: "end_time" },
  { label: "Start Time", value: "start_time" },
];

type StatusFilter = AdminMarketStatus | "all";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "Conflict", value: "conflict" },
  { label: "Pending Verification", value: "pending_verification" },
  { label: "Monitoring", value: "monitoring" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: "all" },
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
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateTime(iso: string): { label: string; isActive: boolean } {
  if (!iso) return { label: "—", isActive: false };
  const d = new Date(iso);
  const now = new Date();
  const isActive = d > now;
  const label = d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  return { label, isActive };
}

function statusBadge(market: AdminMarket) {
  switch (market.status) {
    case "conflict":
      return <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400">Conflict</Badge>;
    case "monitoring":
      return <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400">Monitoring</Badge>;
    case "pending_verification":
      return <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400">Pending Verification</Badge>;
    case "resolved":
      return <Badge variant="outline" className="text-[10px] text-muted-foreground">Resolved</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{market.status}</Badge>;
  }
}

export function MarketTable() {
  const { accessCode } = useRole();
  const router = useRouter();
  const [markets, setMarkets] = useState<AdminMarket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortField>("expected_resolve_time");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("conflict");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [marketTypeFilter, setMarketTypeFilter] = useState<MarketTypeFilter>("all");
  const pageSize = 20;

  const load = useCallback(async () => {
    if (!accessCode) return;
    setLoading(true);
    try {
      const data = await fetchMarkets(accessCode, {
        page_num: page,
        page_size: pageSize,
        sort,
        order,
        status: statusFilter === "all" ? undefined : statusFilter,
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
  }, [accessCode, sort, order, page, statusFilter, sourceFilter, marketTypeFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/30 p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
              if (tab.value === "resolved") {
                setSort("updated_time");
                setOrder("desc");
              } else {
                setSort("expected_resolve_time");
                setOrder("asc");
              }
            }}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              statusFilter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Market Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>AI Outcome</TableHead>
                <TableHead>Expected Resolve</TableHead>
                <TableHead>Silence Until</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : markets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No markets found
                  </TableCell>
                </TableRow>
              ) : (
                markets.map((m) => (
                  <TableRow
                    key={m.id}
                    className={cn(
                      "cursor-pointer",
                      m.status === "pending_verification" && "bg-amber-500/5",
                      m.status === "conflict" && "bg-red-500/5"
                    )}
                    onClick={() => router.push(`/admin/markets/${m.id}`)}
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
                    <TableCell className="text-muted-foreground text-xs">
                      {m.market_timing_type || "—"}
                    </TableCell>
                    <TableCell>{statusBadge(m)}</TableCell>
                    <TableCell>
                      {m.ai_outcome ? (
                        <span className="font-semibold">{m.ai_outcome}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(m.expected_resolve_time)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {(() => {
                        if (!m.silence_deadline) return <span className="text-muted-foreground">—</span>;
                        const { label, isActive } = formatDateTime(m.silence_deadline);
                        return isActive
                          ? <span className="text-amber-400">{label}</span>
                          : <span className="text-muted-foreground">{label}</span>;
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(m.end_time)}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/markets/${m.id}`); }}
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </button>
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
