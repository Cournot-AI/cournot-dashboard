"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/intelligence/pagination";
import { PageLoading, PageError, PageEmpty } from "@/components/intelligence/loading-error";
import { PremiumCodeInput } from "@/components/intelligence/premium-code-input";
import { SourceFreshnessPanel } from "@/components/intelligence/source-freshness-panel";
import { VerticalBadge } from "@/components/intelligence/vertical-card";
import { ImpactBadge, RealTimeBadge } from "@/components/intelligence/badges";
import { ConfidenceBar } from "@/components/shared/confidence-bar";
import { useRole } from "@/lib/role";
import {
  fetchPremiumImpacts,
  fetchSources,
  fetchVerticals,
  type PremiumImpact,
  type SourceFreshness,
  type VerticalInfo,
} from "@/lib/intelligence-api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Zap } from "lucide-react";

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function ImpactCard({ impact }: { impact: PremiumImpact }) {
  return (
    <Card className="border-border/50 transition-all hover:border-primary/30 hover:bg-accent/20">
      <CardContent className="pt-3 pb-3 px-4">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <ImpactBadge direction={impact.direction} impactType={impact.impact_type} />
          {impact.vertical && <VerticalBadge vertical={impact.vertical} />}
          <RealTimeBadge />
        </div>

        {/* Market */}
        <Link
          href={`/markets/${impact.market_id}`}
          className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
        >
          {impact.market_title || `Market #${impact.market_id}`}
        </Link>

        {/* Event */}
        {impact.canonical_event_title && (
          <Link
            href={`/intelligence/events/${impact.canonical_event_id}`}
            className="block mt-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors line-clamp-1"
          >
            Event: {impact.canonical_event_title}
          </Link>
        )}

        {/* Evidence summary */}
        {impact.evidence_summary && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
            {impact.evidence_summary}
          </p>
        )}

        {/* Bottom */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            {impact.confidence > 0 && (
              <ConfidenceBar confidence={impact.confidence} size="sm" />
            )}
            {impact.probability_delta !== 0 && (
              <span className={cn(
                "font-mono tabular-nums",
                impact.probability_delta > 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {impact.probability_delta > 0 ? "+" : ""}{(impact.probability_delta * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <span>{formatDate(impact.created_time)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PremiumPage() {
  const { accessCode } = useRole();
  const [code, setCode] = useState(accessCode || "");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const [impacts, setImpacts] = useState<PremiumImpact[]>([]);
  const [sources, setSources] = useState<SourceFreshness[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [vertical, setVertical] = useState("");
  const [direction, setDirection] = useState("");
  const [impactType, setImpactType] = useState("");
  const [verticals, setVerticals] = useState<VerticalInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  // Try stored code on mount
  useEffect(() => {
    if (accessCode) {
      setCode(accessCode);
      setHasAccess(true);
    }
  }, [accessCode]);

  useEffect(() => {
    fetchVerticals().then((r) => setVerticals(r.verticals ?? [])).catch(() => {});
  }, []);

  const handleCodeSubmit = async (inputCode: string) => {
    setCodeLoading(true);
    setCodeError(null);
    try {
      // Test the code by fetching impacts
      await fetchPremiumImpacts(inputCode, { page_num: 1, page_size: 1 });
      setCode(inputCode);
      setHasAccess(true);
    } catch {
      setCodeError("Invalid access code or insufficient permissions.");
    } finally {
      setCodeLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!hasAccess || !code) return;
    setIsLoading(true);
    setError(null);
    try {
      const [impactsRes, sourcesRes] = await Promise.all([
        fetchPremiumImpacts(code, {
          page_num: page,
          page_size: pageSize,
          vertical: vertical || undefined,
          direction: direction || undefined,
          impact_type: impactType || undefined,
        }),
        fetchSources(code, vertical || undefined),
      ]);
      setImpacts(impactsRes.impacts ?? []);
      setTotal(impactsRes.total ?? 0);
      setSources(sourcesRes.sources ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load premium data");
    } finally {
      setIsLoading(false);
    }
  }, [hasAccess, code, page, vertical, direction, impactType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold tracking-tight">Premium Intelligence</h1>
            <RealTimeBadge />
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            Access real-time market impact intelligence, source freshness monitoring, and advanced filtering. Enter your access code to unlock.
          </p>
        </div>

        {/* Feature callouts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <Zap className="h-5 w-5 text-emerald-400 mb-2" />
              <h3 className="text-sm font-semibold">Real-Time Impacts</h3>
              <p className="text-xs text-muted-foreground mt-1">No 15-minute delay. See market impacts as they happen.</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <Zap className="h-5 w-5 text-sky-400 mb-2" />
              <h3 className="text-sm font-semibold">Source Freshness</h3>
              <p className="text-xs text-muted-foreground mt-1">Monitor source health and data recency across all verticals.</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <Zap className="h-5 w-5 text-violet-400 mb-2" />
              <h3 className="text-sm font-semibold">Advanced Filters</h3>
              <p className="text-xs text-muted-foreground mt-1">Filter by vertical, direction, impact type, and specific markets.</p>
            </CardContent>
          </Card>
        </div>

        <PremiumCodeInput
          onSubmit={handleCodeSubmit}
          isLoading={codeLoading}
          error={codeError}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">Premium Intelligence</h1>
            <RealTimeBadge />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time market impact feed with full intelligence access.
          </p>
        </div>
      </div>

      {/* Source freshness */}
      {sources.length > 0 && <SourceFreshnessPanel sources={sources} />}

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
        <select
          value={direction}
          onChange={(e) => { setDirection(e.target.value); setPage(1); }}
          className="h-8 rounded-lg border border-border bg-muted/30 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        >
          <option value="">All directions</option>
          <option value="up">Up</option>
          <option value="down">Down</option>
          <option value="neutral">Neutral</option>
        </select>
        <input
          type="text"
          placeholder="Impact type..."
          value={impactType}
          onChange={(e) => { setImpactType(e.target.value); setPage(1); }}
          className="h-8 rounded-lg border border-border bg-muted/30 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors w-40"
        />
        {(vertical || direction || impactType) && (
          <button
            onClick={() => { setVertical(""); setDirection(""); setImpactType(""); setPage(1); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading && impacts.length === 0 && !error && (
        <PageLoading message="Loading real-time impacts..." />
      )}

      {error && <PageError message={error} onRetry={loadData} />}

      {!isLoading && !error && impacts.length === 0 && (
        <PageEmpty title="No impacts" message="No real-time impacts match your filters." />
      )}

      {impacts.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {impacts.map((impact) => (
              <ImpactCard key={impact.id} impact={impact} />
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
