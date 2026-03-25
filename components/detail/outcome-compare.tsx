"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OutcomeBadge,
  SourceStatusBadge,
  VerificationBadge,
  ExecutionModeBadge,
  MatchIndicator,
} from "@/components/shared/status-badge";
import { ConfidenceBar } from "@/components/shared/confidence-bar";
import { ErrorCallout } from "@/components/shared/error-callout";
import type { MarketCase } from "@/lib/types";
import { getMatchStatus } from "@/lib/types";
import { ExternalLink, Clock, AlertTriangle } from "lucide-react";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function OutcomeCompareCard({ c }: { c: MarketCase }) {
  const matchStatus = getMatchStatus(c);

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Outcome Comparison</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          {/* Left: Official Source */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Official Source
              </p>
              <span className="text-[10px] text-muted-foreground capitalize">{c.source.platform}</span>
            </div>
            <div className="flex items-center gap-3">
              <OutcomeBadge outcome={c.source.official_outcome} size="lg" />
              <SourceStatusBadge status={c.source.status} />
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="text-muted-foreground/60">Resolved: </span>
                {formatDateTime(c.source.official_resolved_at)}
              </p>
              <p>
                <span className="text-muted-foreground/60">Last updated: </span>
                {formatDateTime(c.source.last_updated_at)}
              </p>
            </div>
            <a
              href={c.source.event_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Open in {c.source.platform}
              <ExternalLink className="h-3 w-3" />
            </a>
            {c.source.status === "DISPUTED" && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-400">
                  This market is currently under dispute
                </p>
              </div>
            )}
          </div>

          {/* Center: Match indicator */}
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <MatchIndicator status={matchStatus} size="lg" />
            {matchStatus === "MISMATCH" && (
              <p className="text-[10px] text-orange-400/70 text-center max-w-[120px]">
                Outcomes differ between source and oracle
              </p>
            )}
          </div>

          {/* Right: AI Oracle */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              AI Oracle
            </p>
            {c.oracle_result ? (
              <>
                <div className="flex items-center gap-3">
                  <OutcomeBadge outcome={c.oracle_result.outcome} size="lg" />
                  <ExecutionModeBadge mode={c.oracle_result.execution_mode} />
                </div>
                <div className="space-y-2">
                  <ConfidenceBar confidence={c.oracle_result.confidence} size="lg" showLabel />
                </div>
                <div className="flex items-center gap-2">
                  <VerificationBadge ok={c.oracle_result.verification_ok} />
                  {!c.oracle_result.ok && (
                    <span className="text-[11px] text-red-400 font-medium">Run errored</span>
                  )}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="text-muted-foreground/60">Executed: </span>
                    {formatDateTime(c.oracle_result.executed_at)}
                  </p>
                  <p>
                    <span className="text-muted-foreground/60">Duration: </span>
                    {c.oracle_result.duration_ms}ms
                  </p>
                </div>
                {(c.oracle_result.errors ?? []).length > 0 && (
                  <ErrorCallout errors={c.oracle_result.errors} />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Not processed yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  Awaiting resolution window
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
