"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import type { MarketCase, ParseResult, RunSummary, ExecutionLog } from "@/lib/types";
import { HeroPending } from "@/components/detail/hero-pending";
import { HeroResolved } from "@/components/detail/hero-resolved";
import { PillarUnderstanding } from "@/components/detail/pillar-understanding";
import { PillarPerformance } from "@/components/detail/pillar-performance";
import { PillarTrust } from "@/components/detail/pillar-trust";
import { DeepTabs } from "@/components/detail/deep-tabs";
import { DiscoveredSourcesCard } from "@/components/detail/discovered-sources";
import { EvidenceSection } from "@/components/detail/evidence-section";
import { ExecutionLogsCard } from "@/components/detail/execution-logs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

import type { ResolutionArtifacts, DisputeResponse } from "@/components/playground/dispute-panel";
import { PipelineStepsView } from "@/components/playground/pipeline-steps-view";
import { LLMDisputePanel } from "@/components/playground/llm-dispute-panel";
import { ValidationCard, type ValidationResult } from "@/components/playground/validation-card";

interface PlaygroundResultsProps {
  promptResult: ParseResult;
  resolveResult: RunSummary | null;
  userInput: string;
  executionLogs?: ExecutionLog[];
  resolutionArtifacts?: ResolutionArtifacts | null;
  validationResult?: ValidationResult | null;
  onSubmitDispute?: (payload: any) => Promise<DisputeResponse>;
  onSubmitLLMDispute?: (payload: any) => Promise<DisputeResponse>;
}

function buildSyntheticCase(
  promptResult: ParseResult,
  resolveResult: RunSummary | null,
  userInput: string
): MarketCase {
  const spec = promptResult.prompt_spec;
  const now = new Date().toISOString();

  return {
    market_id: `playground-${Date.now()}`,
    slug: `playground-${Date.now()}`,
    source: {
      platform: "Playground",
      event_url: "",
      title: userInput.slice(0, 100),
      question: userInput,
      resolution_deadline: spec?.market.resolution_deadline ?? now,
      resolution_window: spec?.market.resolution_window ?? {
        start: now,
        end: now,
      },
      status: resolveResult ? "RESOLVED" : "OPEN",
      official_outcome: "UNKNOWN",
      official_resolved_at: null,
      last_updated_at: now,
    },
    parse_result: promptResult,
    oracle_result: resolveResult,
  };
}

export function PlaygroundResults({
  promptResult,
  resolveResult,
  userInput,
  executionLogs = [],
  resolutionArtifacts = null,
  validationResult = null,
  onSubmitDispute,
  onSubmitLLMDispute,
}: PlaygroundResultsProps) {
  // Debug: log resolveResult to console
  console.log("resolveResult:", JSON.stringify(resolveResult, null, 2));

  const c = buildSyntheticCase(promptResult, resolveResult, userInput);
  const isResolved = resolveResult !== null;

  const showDisputeTab =
    isResolved && !!resolutionArtifacts && !!resolveResult && !!onSubmitDispute;

  const qualityScorecard = resolutionArtifacts?.quality_scorecard ?? null;
  const temporalConstraint = resolutionArtifacts?.temporal_constraint ?? null;

  const resultsContent = (
    <>
      {/* Market Validation (from /validate endpoint) — only shown at prompt step, hidden after resolve */}
      {!isResolved && validationResult && <ValidationCard result={validationResult} />}

      {/* Hero section */}
      {isResolved ? <HeroResolved c={c} /> : <HeroPending c={c} />}

      {/* Quality & temporal summary (resolve only) */}
      {isResolved && (qualityScorecard || temporalConstraint) && (
        <QualitySummaryCard scorecard={qualityScorecard} temporalConstraint={temporalConstraint} />
      )}

      {/* Evidence Section (resolve only) */}
      {isResolved && resolveResult.evidence_items && resolveResult.evidence_items.length > 0 && (
        <EvidenceSection result={resolveResult} />
      )}

      {/* Execution Logs (from collect step) */}
      {executionLogs.length > 0 && (
        <ExecutionLogsCard logs={executionLogs} />
      )}

      {/* Discovered Sources (resolve only, legacy format) */}
      {isResolved && resolveResult.discovered_sources && resolveResult.discovered_sources.length > 0 && (
        <DiscoveredSourcesCard sources={resolveResult.discovered_sources} />
      )}

      {/* Pillars */}
      <div className="space-y-6">
        <PillarUnderstanding c={c} />
        {isResolved && (
          <>
            <PillarPerformance c={c} />
            <PillarTrust c={c} />
          </>
        )}
      </div>

      {/* Deep Tabs */}
      <DeepTabs c={c} />
    </>
  );

  if (!showDisputeTab) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {resultsContent}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Tabs defaultValue="results">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          {onSubmitLLMDispute && (
            <TabsTrigger value="dispute">Dispute</TabsTrigger>
          )}
          <TabsTrigger value="pipeline">Pipeline &amp; Advanced Dispute</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <div className="space-y-6">
            {resultsContent}
          </div>
        </TabsContent>

        {onSubmitLLMDispute && (
          <TabsContent value="dispute">
            <LLMDisputePanel
              artifacts={resolutionArtifacts!}
              onSubmit={onSubmitLLMDispute}
            />
          </TabsContent>
        )}

        <TabsContent value="pipeline">
          <PipelineStepsView
            artifacts={resolutionArtifacts!}
            resolveResult={resolveResult!}
            promptResult={promptResult}
            onSubmitDispute={onSubmitDispute!}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Quality Summary Card (compact, for Results tab) ────────────────────────

function QualitySummaryCard({
  scorecard,
  temporalConstraint,
}: {
  scorecard: any;
  temporalConstraint: any;
}) {
  const [expanded, setExpanded] = useState(false);

  const qualityColors: Record<string, string> = {
    HIGH: "text-emerald-400 border-emerald-500/50",
    MEDIUM: "text-amber-400 border-amber-500/50",
    LOW: "text-red-400 border-red-500/50",
  };
  const sourceMatchColors: Record<string, string> = {
    FULL: "text-emerald-400",
    PARTIAL: "text-amber-400",
    NONE: "text-red-400",
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Row: badges + key metrics */}
        <div className="flex items-center gap-3 flex-wrap">
          {scorecard && (
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium">Quality</span>
              <Badge
                variant="outline"
                className={cn("text-[10px]", qualityColors[scorecard.quality_level])}
              >
                {scorecard.quality_level}
              </Badge>
              {scorecard.meets_threshold ? (
                <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-400">
                  Passed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-400">
                  Below threshold
                </Badge>
              )}
            </div>
          )}

          {temporalConstraint && (
            <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Temporal guard</span>
            </div>
          )}
        </div>

        {/* Inline metrics when scorecard present */}
        {scorecard && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>
              <span className="text-muted-foreground">Source match:</span>{" "}
              <span className={sourceMatchColors[scorecard.source_match] ?? ""}>
                {scorecard.source_match}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Agreement:</span>{" "}
              {scorecard.collector_agreement}
            </span>
            {scorecard.requirements_coverage != null && (
              <span>
                <span className="text-muted-foreground">Coverage:</span>{" "}
                <span className="font-mono">{Math.round(scorecard.requirements_coverage * 100)}%</span>
              </span>
            )}
            {scorecard.quality_flags && scorecard.quality_flags.length > 0 && (
              <span>
                <span className="text-muted-foreground">Flags:</span>{" "}
                <span className="text-amber-400 font-mono">{scorecard.quality_flags.join(", ")}</span>
              </span>
            )}
          </div>
        )}

        {/* Temporal constraint reason */}
        {temporalConstraint?.reason && (
          <p className="text-xs text-muted-foreground">
            <span className="text-amber-400">Temporal:</span>{" "}
            {temporalConstraint.reason}
            {temporalConstraint.event_time && (
              <span className="font-mono ml-1">({temporalConstraint.event_time})</span>
            )}
          </p>
        )}

        {/* Expand for recommendations */}
        {scorecard?.recommendations && scorecard.recommendations.length > 0 && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight
                className={cn(
                  "w-3 h-3 transition-transform",
                  expanded && "rotate-90"
                )}
              />
              {scorecard.recommendations.length} recommendation{scorecard.recommendations.length !== 1 ? "s" : ""}
            </button>
            {expanded && (
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 ml-1">
                {scorecard.recommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
