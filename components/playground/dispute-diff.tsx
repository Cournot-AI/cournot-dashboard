"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

function safeJson(obj: any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function tierColor(tier: number): string {
  switch (tier) {
    case 1: return "bg-green-500/10 text-green-400";
    case 2: return "bg-blue-500/10 text-blue-400";
    case 3: return "bg-yellow-500/10 text-yellow-500";
    default: return "bg-muted text-muted-foreground";
  }
}

/** Flatten evidence bundles into a summary list of sources */
function summarizeEvidence(bundles: any[]): { domain: string; url: string; keyFact: string; supports: string; tier: number }[] {
  const out: { domain: string; url: string; keyFact: string; supports: string; tier: number }[] = [];
  for (const bundle of bundles) {
    for (const item of bundle?.items ?? []) {
      for (const src of item?.extracted_fields?.evidence_sources ?? []) {
        out.push({
          domain: src.domain_name || src.domain || "",
          url: src.url || "",
          keyFact: src.key_fact || "",
          supports: src.supports || "N/A",
          tier: typeof src.credibility_tier === "number" ? src.credibility_tier : 3,
        });
      }
    }
  }
  return out;
}

function EvidenceSummaryList({ sources, label }: { sources: ReturnType<typeof summarizeEvidence>; label: string }) {
  if (sources.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 p-3">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <p className="text-xs text-muted-foreground/60 italic">No evidence sources</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border/50 p-3">
      <div className="text-xs text-muted-foreground mb-2">{label} ({sources.length} sources)</div>
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {sources.map((src, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px]">
            <Badge variant="outline" className={cn("text-[9px] shrink-0 mt-0.5", tierColor(src.tier))}>
              T{src.tier}
            </Badge>
            <Badge variant="outline" className={cn("text-[9px] shrink-0 mt-0.5", {
              "bg-green-500/10 text-green-400": src.supports === "YES",
              "bg-red-500/10 text-red-400": src.supports === "NO",
            })}>
              {src.supports}
            </Badge>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-medium truncate">{src.domain || "unknown"}</span>
                {src.url && (
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-primary shrink-0">
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              {src.keyFact && (
                <p className="text-muted-foreground/70 leading-tight line-clamp-2">{src.keyFact}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DisputeDiff({
  beforeVerdict,
  afterVerdict,
  beforeReasoning,
  afterReasoning,
  beforeEvidence,
  afterEvidence,
}: {
  beforeVerdict: any;
  afterVerdict: any;
  beforeReasoning: any;
  afterReasoning: any;
  beforeEvidence?: any[];
  afterEvidence?: any[];
}) {
  const outcomeBefore = beforeVerdict?.outcome ?? null;
  const outcomeAfter = afterVerdict?.outcome ?? null;
  const confBefore = beforeVerdict?.confidence ?? null;
  const confAfter = afterVerdict?.confidence ?? null;

  const outcomeChanged = outcomeBefore !== outcomeAfter;
  const confChanged = confBefore !== confAfter;

  const reasoningSummaryBefore = beforeReasoning?.reasoning_summary ?? "";
  const reasoningSummaryAfter = afterReasoning?.reasoning_summary ?? "";

  const beforeSources = beforeEvidence ? summarizeEvidence(beforeEvidence) : [];
  const afterSources = afterEvidence ? summarizeEvidence(afterEvidence) : [];
  const hasEvidence = beforeSources.length > 0 || afterSources.length > 0;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm">Dispute Result (Diff)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Verdict comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">Before</div>
            <div className="text-sm">Outcome: <span className="font-medium">{String(outcomeBefore)}</span></div>
            <div className="text-sm">Confidence: {confBefore != null ? String(confBefore) : ""}</div>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">After</div>
            <div className="text-sm">
              Outcome: <span className={cn("font-medium", outcomeChanged && "text-amber-400")}>{String(outcomeAfter)}</span>
              {outcomeChanged && <span className="text-[10px] text-amber-400 ml-1">(changed)</span>}
            </div>
            <div className="text-sm">
              Confidence: <span className={cn(confChanged && "text-amber-400")}>{confAfter != null ? String(confAfter) : ""}</span>
              {confChanged && <span className="text-[10px] text-amber-400 ml-1">(changed)</span>}
            </div>
          </div>
        </div>

        {/* Reasoning comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground">Reasoning summary (before)</div>
            <pre className="text-xs whitespace-pre-wrap mt-2 max-h-[200px] overflow-y-auto">{reasoningSummaryBefore}</pre>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground">Reasoning summary (after)</div>
            <pre className="text-xs whitespace-pre-wrap mt-2 max-h-[200px] overflow-y-auto">{reasoningSummaryAfter}</pre>
          </div>
        </div>

        {/* Evidence comparison */}
        {hasEvidence && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EvidenceSummaryList sources={beforeSources} label="Evidence (before)" />
            <EvidenceSummaryList sources={afterSources} label="Evidence (after)" />
          </div>
        )}

        {/* Raw JSON collapses */}
        <details className="rounded-lg border border-border/50 p-3">
          <summary className="text-xs text-muted-foreground cursor-pointer">Raw verdict JSON</summary>
          <pre className="text-xs whitespace-pre-wrap mt-2 max-h-[400px] overflow-y-auto">{safeJson({ beforeVerdict, afterVerdict })}</pre>
        </details>

        <details className="rounded-lg border border-border/50 p-3">
          <summary className="text-xs text-muted-foreground cursor-pointer">Raw reasoning_trace JSON</summary>
          <pre className="text-xs whitespace-pre-wrap mt-2 max-h-[400px] overflow-y-auto">{safeJson({ beforeReasoning, afterReasoning })}</pre>
        </details>
      </CardContent>
    </Card>
  );
}
