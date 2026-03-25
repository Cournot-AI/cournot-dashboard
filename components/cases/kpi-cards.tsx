"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { MarketCase } from "@/lib/types";
import { getMatchStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface KpiItem {
  label: string;
  value: number | string;
  color: string;
  filterKey?: string; // used to signal parent what filter to apply on click
}

function computeKpis(cases: MarketCase[]) {
  const resolved = cases.filter((c) => c.source.status === "RESOLVED");
  const withOracle = cases.filter((c) => c.oracle_result !== null);
  const matches = cases.filter((c) => getMatchStatus(c) === "MATCH");
  const mismatches = cases.filter((c) => getMatchStatus(c) === "MISMATCH");
  const verifyFails = cases.filter((c) => getMatchStatus(c) === "VERIFICATION_FAILED");
  const verified = withOracle.filter((c) => c.oracle_result!.verification_ok);

  // Match rate: of resolved cases that have oracle results, what % matched
  const resolvedWithOracle = resolved.filter((c) => c.oracle_result !== null);
  const matchRate =
    resolvedWithOracle.length > 0
      ? matches.length / resolvedWithOracle.length
      : 0;

  // Verification pass rate
  const verifyRate =
    withOracle.length > 0 ? verified.length / withOracle.length : 0;

  // Avg resolve latency (oracle executed_at - source official_resolved_at)
  const latencies: number[] = [];
  for (const c of resolved) {
    if (c.oracle_result && c.source.official_resolved_at) {
      const delta =
        new Date(c.oracle_result.executed_at).getTime() -
        new Date(c.source.official_resolved_at).getTime();
      latencies.push(Math.abs(delta));
    }
  }
  const avgLatencyMs =
    latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

  // Median API calls (sources count per resolution)
  const sourceCounts = withOracle
    .map((c) => c.parse_result.tool_plan?.sources.length ?? 0)
    .sort((a, b) => a - b);
  const medianSources =
    sourceCounts.length > 0
      ? sourceCounts[Math.floor(sourceCounts.length / 2)]
      : 0;

  return { matchRate, verifyRate, avgLatencyMs, medianSources, mismatches: mismatches.length, verifyFails: verifyFails.length };
}

function formatLatency(ms: number): string {
  if (ms === 0) return "—";
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)}m`;
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

export function KpiCards({
  cases,
  onFilterClick,
}: {
  cases: MarketCase[];
  onFilterClick?: (filterKey: string) => void;
}) {
  const k = computeKpis(cases);

  const kpis: KpiItem[] = [
    {
      label: "Match Rate",
      value: `${Math.round(k.matchRate * 100)}%`,
      color: k.matchRate >= 0.9 ? "text-emerald-400" : k.matchRate >= 0.7 ? "text-sky-400" : "text-amber-400",
    },
    {
      label: "Verification Rate",
      value: `${Math.round(k.verifyRate * 100)}%`,
      color: k.verifyRate >= 0.95 ? "text-emerald-400" : "text-amber-400",
    },
    {
      label: "Avg Resolve Latency",
      value: formatLatency(k.avgLatencyMs),
      color: "text-sky-400",
    },
    {
      label: "Median Sources",
      value: k.medianSources,
      color: "text-violet-400",
    },
    {
      label: "Mismatches",
      value: k.mismatches,
      color: k.mismatches > 0 ? "text-orange-400" : "text-emerald-400",
      filterKey: "MISMATCH",
    },
    {
      label: "Verify Failures",
      value: k.verifyFails,
      color: k.verifyFails > 0 ? "text-red-400" : "text-emerald-400",
      filterKey: "VERIFICATION_FAILED",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className={cn(
            "border-border/50 transition-colors",
            kpi.filterKey && "cursor-pointer hover:border-primary/40 hover:bg-accent/30"
          )}
          onClick={() => kpi.filterKey && onFilterClick?.(kpi.filterKey)}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
            <p className={`text-xl font-bold tabular-nums mt-0.5 ${kpi.color}`}>
              {kpi.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
