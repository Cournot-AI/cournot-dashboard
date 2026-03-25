"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ErrorCallout } from "@/components/shared/error-callout";
import { InlineCopyButton } from "@/components/shared/copy-field";
import type { RunSummary, Check, EvidenceItem, EvidenceBundle } from "@/lib/types";
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Globe,
  FileText,
  ExternalLink,
  Shield,
  Layers,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const checkStatusConfig: Record<
  Check["status"],
  { icon: typeof CheckCircle2; color: string; label: string }
> = {
  pass: { icon: CheckCircle2, color: "text-emerald-400", label: "Pass" },
  fail: { icon: XCircle, color: "text-red-400", label: "Fail" },
  warn: { icon: AlertTriangle, color: "text-yellow-400", label: "Warn" },
  skip: { icon: MinusCircle, color: "text-slate-400", label: "Skip" },
};

function CheckItem({ check }: { check: Check }) {
  const [open, setOpen] = useState(false);
  const cfg = checkStatusConfig[check.status];
  const Icon = cfg.icon;

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/30 transition-colors"
      >
        <Icon className={cn("h-4 w-4 shrink-0", cfg.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">{check.name}</p>
        </div>
        <Badge variant="outline" className={cn("text-[10px]", cfg.color, "border-current/20")}>
          {cfg.label}
        </Badge>
        {check.requirement_id && (
          <Badge variant="outline" className="text-[10px] font-mono">
            {check.requirement_id}
          </Badge>
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform shrink-0",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t border-border/50 px-3 py-2 bg-muted/10">
          <p className="text-xs text-muted-foreground leading-relaxed">{check.message}</p>
          {check.check_id && (
            <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">
              ID: {check.check_id}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function EvidenceSection({
  result,
}: {
  result: RunSummary | null;
}) {
  const outcome = result?.outcome;
  if (!result) return null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Evidence & Execution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Evidence Bundles (new multi-collector format) */}
        {result.evidence_bundles && result.evidence_bundles.length > 0 && (
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-violet-400" />
                  <p className="text-sm font-medium">
                    Evidence Bundles ({result.evidence_bundles.length})
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {result.evidence_bundles.reduce((sum, b) => sum + b.items.length, 0)} total items
                </p>
              </div>
              <div className="space-y-4">
                {result.evidence_bundles.map((bundle) => (
                  <EvidenceBundleCard key={bundle.bundle_id} bundle={bundle} outcome={outcome} />
                ))}
              </div>
          </div>
        )}

        {/* Legacy: Evidence items (single bundle format) */}
        {!result.evidence_bundles && result.evidence_items && result.evidence_items.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Evidence Items ({result.evidence_items.length})
              </p>
              <div className="space-y-2">
                {result.evidence_items.map((item) => (
                  <EvidenceItemCard key={item.evidence_id} item={item} outcome={outcome} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Checks */}
        {(result.checks ?? []).length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Checks ({(result.checks ?? []).length})
            </p>
            <div className="space-y-1.5">
              {(result.checks ?? []).map((check) => (
                <CheckItem key={check.check_id} check={check} />
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {result.errors.length > 0 && <ErrorCallout errors={result.errors} />}
      </CardContent>
    </Card>
  );
}

// ─── Evidence Bundle Card ─────────────────────────────────────────────────

const collectorColors: Record<string, string> = {
  CollectorWebPageReader: "text-violet-400 border-violet-500/30 bg-violet-500/10",
  CollectorSitePinned: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
  CollectorHyDE: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  CollectorHTTP: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  CollectorMock: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  CollectorOpenSearch: "text-orange-400 border-orange-500/30 bg-orange-500/10",
};

function EvidenceBundleCard({ bundle, outcome }: { bundle: EvidenceBundle; outcome?: string }) {
  const [expanded, setExpanded] = useState(true);
  const colorClass = collectorColors[bundle.collector_name] ?? "text-muted-foreground border-border bg-muted/20";

  // Collector-level fields from the first item
  const collectorExtracted = bundle.items[0]?.extracted_fields;
  const collectorOutcome = collectorExtracted?.outcome;
  const collectorReason = collectorExtracted?.reason;
  const collectorConfidence = collectorExtracted?.confidence_score;

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      {/* Bundle Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
      >
        <div className={cn("p-2 rounded-lg border", colorClass)}>
          <Layers className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{bundle.collector_name}</p>
            <Badge variant="outline" className={cn("text-[10px]", colorClass)}>
              {bundle.items.length} items
            </Badge>
            {collectorOutcome && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-medium",
                  collectorOutcome === "Yes"
                    ? "text-emerald-400 border-emerald-500/30"
                    : collectorOutcome === "No"
                      ? "text-red-400 border-red-500/30"
                      : "text-amber-400 border-amber-500/30"
                )}
              >
                {collectorOutcome}
              </Badge>
            )}
            {collectorConfidence != null && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {Math.round(collectorConfidence * 100)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {bundle.execution_time_ms !== undefined && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {bundle.execution_time_ms}ms
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              Weight: {bundle.weight.toFixed(1)}
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Bundle Content */}
      {expanded && (
        <div className="border-t border-border/50 p-4 bg-muted/5 space-y-3">
          {/* Collector-level reason */}
          {collectorReason && (
            <div className="rounded-lg bg-muted/20 border border-border/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Collector Reasoning
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {collectorReason}
              </p>
            </div>
          )}

          {bundle.items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No evidence items collected
            </p>
          ) : (
            <div className="space-y-2">
              {bundle.items.map((item, idx) => (
                <EvidenceItemCard key={item.evidence_id || idx} item={item} outcome={outcome} />
              ))}
            </div>
          )}

          {/* Bundle metadata */}
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-2 border-t border-border/30">
            <span className="font-mono">ID: {bundle.bundle_id.slice(0, 16)}...</span>
            <InlineCopyButton value={bundle.bundle_id} label="Bundle ID" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Evidence Item Card ───────────────────────────────────────────────────

function getTierColor(tier: number): string {
  if (tier === 1) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
  if (tier === 2) return "text-sky-400 border-sky-500/20 bg-sky-500/10";
  if (tier === 3) return "text-yellow-400 border-yellow-500/20 bg-yellow-500/10";
  return "text-muted-foreground border-border";
}

function getSupportsColor(supports: string): string {
  if (supports === "YES") return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
  if (supports === "NO") return "text-red-400 border-red-500/20 bg-red-500/10";
  return "text-muted-foreground border-border";
}

const TIER_LABELS: Record<number, string> = {
  1: "Tier 1 — Authoritative",
  2: "Tier 2 — Reputable",
  3: "Tier 3 — Low-confidence",
};

/** Format the supports badge label with outcome context */
function formatSupportsLabel(supports: string, outcome?: string): string {
  if (supports === "N/A") return "N/A";
  if (!outcome || outcome === "UNKNOWN") return supports === "YES" ? "Supports" : "Contradicts";
  return supports === "YES" ? `Supports: ${outcome}` : `Contradicts: ${outcome}`;
}

function EvidenceItemCard({ item, outcome }: { item: EvidenceItem; outcome?: string }) {
  // Start expanded if there are evidence sources to show
  const evidenceSources = item.extracted_fields?.evidence_sources ?? [];
  const [expanded, setExpanded] = useState(evidenceSources.length > 0);
  const isSuccess = item.success !== false && !item.error;
  const resolutionStatus = item.extracted_fields?.resolution_status;
  const confidenceScore = item.extracted_fields?.confidence_score;

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/30 transition-colors"
      >
        <Globe
          className={cn(
            "h-4 w-4 shrink-0",
            isSuccess ? "text-emerald-400" : "text-red-400"
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{item.source_name}</p>
          <p className="text-[10px] text-muted-foreground font-mono truncate">
            {item.source_uri}
          </p>
        </div>
        {resolutionStatus && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-mono shrink-0",
              resolutionStatus === "RESOLVED"
                ? "text-emerald-400 border-emerald-500/20"
                : resolutionStatus === "UNRESOLVED"
                ? "text-yellow-400 border-yellow-500/20"
                : "text-muted-foreground"
            )}
          >
            {resolutionStatus}
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px] font-mono shrink-0">
          Tier {item.tier}
        </Badge>
        {evidenceSources.length > 0 && (
          <Badge variant="outline" className="text-[10px] font-mono shrink-0 text-violet-400 border-violet-500/20">
            {evidenceSources.length} sources
          </Badge>
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted-foreground transition-transform shrink-0",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <div className="border-t border-border/50 px-3 py-3 bg-muted/10 space-y-3">
          {/* Error message if present */}
          {item.error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-xs text-red-400 font-medium">{item.error}</p>
            </div>
          )}

          {/* Resolution status and confidence */}
          {(resolutionStatus || confidenceScore != null) && (
            <div className="flex items-center gap-4 text-xs">
              {resolutionStatus && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      resolutionStatus === "RESOLVED"
                        ? "text-emerald-400 border-emerald-500/20"
                        : "text-yellow-400 border-yellow-500/20"
                    )}
                  >
                    {resolutionStatus}
                  </Badge>
                </div>
              )}
              {confidenceScore != null && (
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-mono text-foreground/80">
                    {(confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Evidence Sources */}
          {evidenceSources.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Evidence Sources ({evidenceSources.length})
                </p>
              </div>
              <div className="space-y-2">
                {evidenceSources.map((source, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                        {source.source_id && (
                          <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                            {source.source_id}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-medium shrink-0", getTierColor(source.credibility_tier))}
                        >
                          {TIER_LABELS[source.credibility_tier] ?? `Tier ${source.credibility_tier}`}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-medium shrink-0", getSupportsColor(source.supports))}
                        >
                          {formatSupportsLabel(source.supports, outcome)}
                        </Badge>
                        {source.date_published && (
                          <span className="text-[10px] text-muted-foreground">
                            {source.date_published}
                          </span>
                        )}
                      </div>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </a>
                      )}
                    </div>
                    {source.url && (
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {source.domain_name ?? source.url}
                      </p>
                    )}
                    {source.key_fact && (
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        {source.key_fact}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parsed excerpt (if no evidence sources or has additional content) */}
          {item.parsed_excerpt && evidenceSources.length === 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Parsed Excerpt
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 border border-border/50 p-3">
                <p className="text-xs text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap">
                  {item.parsed_excerpt}
                </p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Fetched at: </span>
              <span className="font-mono text-foreground/80">
                {item.fetched_at ? new Date(item.fetched_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  timeZoneName: "short",
                }) : "—"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Content hash: </span>
              <span className="font-mono text-foreground/70 text-[10px] truncate">
                {item.content_hash ? `${item.content_hash.slice(0, 16)}...` : "—"}
              </span>
              {item.content_hash && (
                <InlineCopyButton
                  value={item.content_hash}
                  label="Content hash"
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-mono">
              {item.evidence_id}
            </span>
            <InlineCopyButton
              value={item.evidence_id}
              label="Evidence ID"
            />
          </div>
        </div>
      )}
    </div>
  );
}
