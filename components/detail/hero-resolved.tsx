"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  OutcomeBadge,
  MatchIndicator,
  VerificationBadge,
  ExecutionModeBadge,
  SourceStatusBadge,
} from "@/components/shared/status-badge";
import { ConfidenceBar } from "@/components/shared/confidence-bar";
import { ErrorCallout } from "@/components/shared/error-callout";
import type { MarketCase } from "@/lib/types";
import { getMatchStatus } from "@/lib/types";
import {
  ExternalLink,
  AlertTriangle,
  Zap,
  Timer,
  Database,
  Shield,
  FileText,
} from "lucide-react";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${(s / 60).toFixed(1)}m`;
}

export function HeroResolved({ c }: { c: MarketCase }) {
  const matchStatus = getMatchStatus(c);
  const oracle = c.oracle_result;

  return (
    <Card className="border-border/50 overflow-hidden">
      {/* Top accent: color based on match status */}
      <div
        className={`h-1 ${
          matchStatus === "MATCH"
            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
            : matchStatus === "MISMATCH"
            ? "bg-gradient-to-r from-orange-500 to-orange-400"
            : matchStatus === "VERIFICATION_FAILED"
            ? "bg-gradient-to-r from-red-500 to-red-400"
            : "bg-gradient-to-r from-slate-500 to-slate-400"
        }`}
      />
      <CardContent className="pt-5 pb-5 space-y-5">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <Zap className="h-4.5 w-4.5 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-tight">Outcome & Proof</h2>
          <div className="ml-auto">
            <MatchIndicator status={matchStatus} size="lg" />
          </div>
        </div>

        {/* Side-by-side outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          {/* Left: Official Source */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Official Source
              </p>
              <span className="text-[10px] text-muted-foreground capitalize">
                {c.source.platform}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <OutcomeBadge outcome={c.source.official_outcome} size="lg" />
              <SourceStatusBadge status={c.source.status} />
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
            {oracle ? (
              <>
                <div className="flex items-center gap-3">
                  <OutcomeBadge outcome={oracle.outcome} size="lg" />
                  <ExecutionModeBadge mode={oracle.execution_mode} />
                </div>
                <ConfidenceBar confidence={oracle.confidence} size="lg" showLabel breakdown={oracle.confidence_breakdown} />
                <div className="flex items-center gap-2">
                  <VerificationBadge ok={oracle.verification_ok} />
                  {!oracle.ok && (
                    <span className="text-[11px] text-red-400 font-medium">Run errored</span>
                  )}
                </div>
                {(oracle.errors?.length ?? 0) > 0 && (
                  <ErrorCallout errors={oracle.errors} />
                )}
              </>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No oracle result available
              </div>
            )}
          </div>
        </div>

        {/* Evidence summary + Justification */}
        {oracle?.evidence_summary && (
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Evidence Summary
              </p>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {oracle.evidence_summary}
            </p>
            {oracle.justification && (
              <div className="border-t border-border/50 pt-3 mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Justification
                </p>
                <pre className="text-xs text-foreground/70 font-mono leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-3 border border-border/50">
                  {oracle.justification}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Performance strip */}
        {oracle && (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/10 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Timer className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-mono font-medium">{formatDuration(oracle.duration_ms)}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs">
              <Database className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Sources:</span>
              <span className="font-mono font-medium">
                {c.parse_result.tool_plan?.sources.length ?? 0}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-xs">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Checks:</span>
              <span className="font-mono font-medium">
                {(oracle.checks ?? []).filter((ch) => ch.status === "pass").length}/{(oracle.checks ?? []).length} pass
              </span>
            </div>
            {oracle.execution_mode === "dry_run" && (
              <>
                <div className="h-4 w-px bg-border" />
                <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/20">
                  Dry Run — not committed
                </Badge>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
