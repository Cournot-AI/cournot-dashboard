"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/intelligence/pagination";
import { PageLoading, PageError, PageEmpty } from "@/components/intelligence/loading-error";
import { VerticalBadge } from "@/components/intelligence/vertical-card";
import { fetchPublicMarkets, fetchVerticals, type PublicMarket, type VerticalInfo } from "@/lib/intelligence-api";
import { cn } from "@/lib/utils";
import { Search, ArrowRight, BarChart3 } from "lucide-react";

function MarketCard({ market }: { market: PublicMarket }) {
  return (
    <Link href={`/markets/${market.id}`}>
      <Card className="border-border/50 transition-all hover:border-primary/30 hover:bg-accent/20 cursor-pointer group h-full">
        <CardContent className="pt-4 pb-3 px-4 flex flex-col h-full">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {market.vertical && <VerticalBadge vertical={market.vertical} />}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-medium",
                market.status === "monitoring"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : market.status === "resolved"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-slate-500/10 text-slate-400 border-slate-500/20"
              )}
            >
              {market.status}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="mt-2 text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
            {market.title}
          </h3>

          {/* Description */}
          {market.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {market.description}
            </p>
          )}

          {/* Bottom */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              {market.impact_count > 0 && (
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {market.impact_count} impact{market.impact_count !== 1 ? "s" : ""}
                </span>
              )}
              {market.source && (
                <span className="capitalize">{market.source}</span>
              )}
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<PublicMarket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [vertical, setVertical] = useState("");
  const [status, setStatus] = useState("");
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
      const res = await fetchPublicMarkets({
        page_num: page,
        page_size: pageSize,
        vertical: vertical || undefined,
        status: status || undefined,
        search: search || undefined,
        sort: "created_time",
        order: "desc",
      });
      setMarkets(res.markets ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load markets");
    } finally {
      setIsLoading(false);
    }
  }, [page, vertical, status, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Markets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Prediction markets tracked by our intelligence layer.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-8 w-64 rounded-lg border border-border bg-muted/30 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>
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
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-8 rounded-lg border border-border bg-muted/30 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        >
          <option value="">All statuses</option>
          <option value="monitoring">Monitoring</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        {(vertical || status || search) && (
          <button
            onClick={() => { setVertical(""); setStatus(""); setSearch(""); setSearchInput(""); setPage(1); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading && markets.length === 0 && !error && (
        <PageLoading message="Loading markets..." />
      )}

      {error && <PageError message={error} onRetry={loadData} />}

      {!isLoading && !error && markets.length === 0 && (
        <PageEmpty title="No markets" message="No markets match your search criteria." />
      )}

      {markets.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {markets.map((m) => (
              <MarketCard key={m.id} market={m} />
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
