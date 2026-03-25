"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JsonViewerPro } from "@/components/shared/json-viewer-pro";
import { ErrorCallout } from "@/components/shared/error-callout";
import type { MarketCase, DataRequirement, Check, EvidenceItem, EvidenceSource } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  FileText,
  Route,
  Database,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Package,
  Globe,
  Shield,
  ExternalLink,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabKey =
  | "prompt_spec"
  | "tool_plan"
  | "data_reqs"
  | "evidence"
  | "checks"
  | "errors"
  | "raw";

interface TabDef {
  key: TabKey;
  label: string;
  icon: typeof FileText;
  badge?: (c: MarketCase) => string | null;
}

const tabDefs: TabDef[] = [
  { key: "prompt_spec", label: "PromptSpec", icon: FileText },
  { key: "tool_plan", label: "ToolPlan", icon: Route },
  { key: "data_reqs", label: "Data Requirements", icon: Database },
  { key: "evidence", label: "Evidence Snapshot", icon: Camera },
  {
    key: "checks",
    label: "Checks",
    icon: CheckCircle2,
    badge: (c) => {
      if (!c.oracle_result) return null;
      const checks = c.oracle_result.checks ?? [];
      const fail = checks.filter((ch) => ch.status === "fail").length;
      if (fail > 0) return `${fail} fail`;
      return `${checks.length}`;
    },
  },
  {
    key: "errors",
    label: "Errors",
    icon: AlertTriangle,
    badge: (c) => {
      if (!c.oracle_result || (c.oracle_result.errors ?? []).length === 0) return null;
      return String((c.oracle_result.errors ?? []).length);
    },
  },
  { key: "raw", label: "Raw Bundle", icon: Package },
];

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function DataRequirementsTable({ reqs }: { reqs: DataRequirement[] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Requirement</TableHead>
            <TableHead>Sources</TableHead>
            <TableHead>Expected Fields</TableHead>
            <TableHead>Strategy</TableHead>
            <TableHead>Quorum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reqs.map((req) => (
            <TableRow key={req.requirement_id}>
              <TableCell>
                <div>
                  <Badge variant="outline" className="text-[10px] font-mono mb-1">
                    {req.requirement_id}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{req.description}</p>
                </div>
              </TableCell>
              <TableCell>
                {req.source_targets.length > 0 ? (
                  <div className="space-y-1">
                    {req.source_targets.map((st) => (
                      <div key={st.uri} className="text-[11px]">
                        <span className="font-mono text-violet-400">{st.provider}</span>
                        <p className="text-muted-foreground truncate max-w-[200px] font-mono text-[10px]">
                          {st.uri}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : req.deferred_source_discovery ? (
                  <Badge variant="outline" className="text-[10px] text-sky-400 border-sky-500/20 bg-sky-500/10">
                    Deferred
                  </Badge>
                ) : (
                  <span className="text-[11px] text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {req.expected_fields.map((f) => (
                    <Badge key={f} variant="outline" className="text-[10px] font-mono">
                      {f}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {req.selection_policy.strategy}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {req.selection_policy.quorum}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

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

function EvidenceSourceCard({ source, outcome }: { source: EvidenceSource; outcome?: string }) {
  return (
    <div className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-2">
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
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </a>
        )}
      </div>
      {source.url && (
        <p className="text-[10px] text-muted-foreground font-mono break-all">
          {source.domain_name ?? source.url}
        </p>
      )}
      {source.key_fact && (
        <p className="text-xs text-foreground/70 leading-relaxed">
          {source.key_fact}
        </p>
      )}
    </div>
  );
}

function EvidenceItemPanel({ item, outcome }: { item: EvidenceItem; outcome?: string }) {
  const isSuccess = item.success !== false && !item.error;
  const evidenceSources = item.extracted_fields?.evidence_sources ?? [];
  const resolutionStatus = item.extracted_fields?.resolution_status;
  const confidenceScore = item.extracted_fields?.confidence_score;

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/20">
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
      </div>

      {/* Content */}
      <div className="px-3 py-3 space-y-3">
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
                <EvidenceSourceCard key={idx} source={source} outcome={outcome} />
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground pt-2 border-t border-border/30">
          <span className="font-mono">{item.evidence_id}</span>
          {item.fetched_at && (
            <span>
              Fetched:{" "}
              <span className="font-mono text-foreground/70">
                {new Date(item.fetched_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
          )}
          {item.content_hash && (
            <span className="font-mono truncate max-w-[150px]">
              Hash: {item.content_hash.slice(0, 12)}...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EvidenceSnapshotPanel({ c }: { c: MarketCase }) {
  const plan = c.parse_result.tool_plan;
  const oracle = c.oracle_result;
  const evidenceItems = oracle?.evidence_items ?? [];

  return (
    <div className="space-y-6">
      {/* Evidence Items (if available from resolve) */}
      {evidenceItems.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Evidence Items ({evidenceItems.length})
          </p>
          <div className="space-y-3">
            {evidenceItems.map((item) => (
              <EvidenceItemPanel key={item.evidence_id} item={item} outcome={oracle?.outcome} />
            ))}
          </div>
        </div>
      )}

      {/* Tool Plan Sources (planned sources) */}
      {plan && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {plan.sources.length > 0
              ? `Planned Sources (${plan.sources.length})`
              : "Sources"}
          </p>
          {plan.sources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.sources.map((s) => (
                <div
                  key={s.source_id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                >
                  <Database className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium font-mono capitalize">{s.provider}</p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      {s.endpoint}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                    T{s.tier}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5 flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <p className="text-[11px] text-sky-400">
                Deferred source discovery — sources will be found at resolve time
              </p>
            </div>
          )}

          {/* Execution config */}
          <div className="flex flex-wrap items-center gap-4 text-xs rounded-lg border border-border/50 bg-muted/10 px-4 py-3">
            <div>
              <span className="text-muted-foreground">Min Tier:</span>{" "}
              <span className="font-mono font-medium">T{plan.min_provenance_tier}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Fallbacks:</span>{" "}
              <span className={plan.allow_fallbacks ? "text-emerald-400" : "text-red-400"}>
                {plan.allow_fallbacks ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Requirements:</span>{" "}
              {plan.requirements.map((r) => (
                <Badge key={r} variant="outline" className="text-[10px] font-mono ml-1">
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No plan available */}
      {!plan && evidenceItems.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No tool plan or evidence available
        </div>
      )}

      {/* Duration if available */}
      {oracle && oracle.executed_at && (
        <div className="text-xs text-muted-foreground">
          Executed in <span className="font-mono text-foreground">{oracle.duration_ms}ms</span>
          {" "}on{" "}
          <span className="font-mono text-foreground">
            {new Date(oracle.executed_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}
    </div>
  );
}

function ChecksPanel({ c }: { c: MarketCase }) {
  if (!c.oracle_result || (c.oracle_result.checks ?? []).length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No checks available
      </div>
    );
  }

  const iconMap: Record<Check["status"], { icon: typeof CheckCircle2; color: string }> = {
    pass: { icon: CheckCircle2, color: "text-emerald-400" },
    fail: { icon: XCircle, color: "text-red-400" },
    warn: { icon: AlertTriangle, color: "text-yellow-400" },
    skip: { icon: MinusCircle, color: "text-slate-400" },
  };

  return (
    <div className="space-y-2">
      {(c.oracle_result.checks ?? []).map((check) => {
        const cfg = iconMap[check.status];
        const Icon = cfg.icon;
        return (
          <div
            key={check.check_id}
            className="rounded-lg border border-border/50 px-3 py-2.5 space-y-1"
          >
            <div className="flex items-center gap-2.5">
              <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
              <span className="text-xs font-medium flex-1">{check.name}</span>
              <Badge
                variant="outline"
                className={cn("text-[10px] capitalize", cfg.color, "border-current/20")}
              >
                {check.status}
              </Badge>
              {check.requirement_id && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {check.requirement_id}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground pl-6">{check.message}</p>
          </div>
        );
      })}
    </div>
  );
}

function ErrorsPanel({ c }: { c: MarketCase }) {
  if (!c.oracle_result || (c.oracle_result.errors ?? []).length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No errors recorded
      </div>
    );
  }
  return <ErrorCallout errors={c.oracle_result.errors} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DeepTabs({ c }: { c: MarketCase }) {
  // Read initial tab from URL hash
  const [activeTab, setActiveTab] = useState<TabKey>("prompt_spec");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TabKey;
    if (tabDefs.some((t) => t.key === hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Update URL hash when tab changes
  function handleTabChange(key: TabKey) {
    setActiveTab(key);
    window.history.replaceState(null, "", `#${key}`);
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Deep Dive</CardTitle>
        <p className="text-xs text-muted-foreground">
          Detailed artifacts and raw data — deep-linkable via URL hash
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Tab bar */}
        <div className="flex gap-1 mb-4 overflow-x-auto border-b border-border pb-px">
          {tabDefs.map((tab) => {
            const Icon = tab.icon;
            const badge = tab.badge?.(c);
            const hasErrors =
              tab.key === "errors" &&
              c.oracle_result &&
              (c.oracle_result.errors ?? []).length > 0;

            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 -mb-px",
                  activeTab === tab.key
                    ? "border-primary text-foreground bg-accent/30"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/20"
                )}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
                {badge && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1.5 py-0 h-4",
                      hasErrors ? "text-red-400 border-red-500/20" : ""
                    )}
                  >
                    {badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="min-h-[200px]">
          {activeTab === "prompt_spec" && (
            c.parse_result.prompt_spec ? (
              <JsonViewerPro data={c.parse_result.prompt_spec} title="PromptSpec" />
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                No PromptSpec — parse failed
              </div>
            )
          )}

          {activeTab === "tool_plan" && (
            c.parse_result.tool_plan ? (
              <JsonViewerPro data={c.parse_result.tool_plan} title="ToolPlan" />
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                No ToolPlan available
              </div>
            )
          )}

          {activeTab === "data_reqs" && (
            c.parse_result.prompt_spec ? (
              <DataRequirementsTable reqs={c.parse_result.prompt_spec.data_requirements} />
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                No data requirements — parse failed
              </div>
            )
          )}

          {activeTab === "evidence" && <EvidenceSnapshotPanel c={c} />}

          {activeTab === "checks" && <ChecksPanel c={c} />}

          {activeTab === "errors" && <ErrorsPanel c={c} />}

          {activeTab === "raw" && (
            <JsonViewerPro
              data={{
                market_id: c.market_id,
                source: c.source,
                parse_result: c.parse_result,
                oracle_result: c.oracle_result,
              }}
              title="Full Case Bundle"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
