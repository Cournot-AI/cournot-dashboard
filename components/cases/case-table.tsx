"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackCaseClick } from "@/lib/analytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SourceStatusBadge,
  OutcomeBadge,
  MatchIndicator,
  PlatformBadge,
} from "@/components/shared/status-badge";
import { ConfidenceBar } from "@/components/shared/confidence-bar";
import { InlineCopyButton } from "@/components/shared/copy-field";
import { CaseFilters, type FilterState } from "./case-filters";
import type { MarketCase, MatchStatus } from "@/lib/types";
import { getMatchStatus } from "@/lib/types";
import {
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  Shield,
  Loader2,
} from "lucide-react";
import { cn, renderText } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function severityColor(match: MatchStatus): string {
  switch (match) {
    case "MISMATCH":
      return "bg-orange-500";
    case "VERIFICATION_FAILED":
      return "bg-red-500";
    case "PENDING":
      return "bg-transparent";
    case "MATCH":
      return "bg-transparent";
  }
}

function needsAttention(c: MarketCase): boolean {
  const m = getMatchStatus(c);
  return (
    m === "MISMATCH" ||
    m === "VERIFICATION_FAILED" ||
    !c.parse_result.ok ||
    (c.oracle_result?.errors?.length ?? 0) > 0
  );
}

// ─── AI Readiness (pending cases) ───────────────────────────────────────────

function AiReadinessCell({ c }: { c: MarketCase }) {
  // Resolved: show audit & verify status
  if (c.oracle_result) {
    const audited = c.oracle_result.llm_review != null;
    const verified = c.oracle_result.verification_ok;

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5 text-[10px]">
          {audited ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          ) : (
            <XCircle className="h-3 w-3 text-muted-foreground/50" />
          )}
          <span className="text-muted-foreground">Audit</span>
        </span>
        <span className="inline-flex items-center gap-0.5 text-[10px]">
          {verified ? (
            <Shield className="h-3 w-3 text-emerald-400" />
          ) : (
            <Shield className="h-3 w-3 text-red-400" />
          )}
          <span className="text-muted-foreground">Verify</span>
        </span>
      </div>
    );
  }

  // Pending: show spec, plan, ambiguity
  const parseOk = c.parse_result.ok;
  const planOk = c.parse_result.tool_plan !== null;
  const specOk = c.parse_result.prompt_spec !== null;

  // Ambiguity heuristic: based on data requirements count and strict_mode
  const reqCount = c.parse_result.prompt_spec?.data_requirements.length ?? 0;
  const strict = c.parse_result.metadata.strict_mode;
  const ambiguity: "Low" | "Med" | "High" = !parseOk
    ? "High"
    : strict && reqCount <= 2
    ? "Low"
    : strict
    ? "Med"
    : "Med";

  const ambiguityColor = {
    Low: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    Med: "text-sky-400 border-sky-500/20 bg-sky-500/10",
    High: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5 text-[10px]">
        {specOk ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        ) : (
          <XCircle className="h-3 w-3 text-red-400" />
        )}
        <span className="text-muted-foreground">Spec</span>
      </span>
      <span className="inline-flex items-center gap-0.5 text-[10px]">
        {planOk ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        ) : (
          <XCircle className="h-3 w-3 text-red-400" />
        )}
        <span className="text-muted-foreground">Plan</span>
      </span>
      <Badge
        variant="outline"
        className={cn("text-[9px] px-1.5 py-0", ambiguityColor[ambiguity])}
      >
        {ambiguity}
      </Badge>
    </div>
  );
}

// ─── AI Preview Panel (row expand) ──────────────────────────────────────────

function AiPreviewPanel({ c }: { c: MarketCase }) {
  const spec = c.parse_result.prompt_spec;
  const plan = c.parse_result.tool_plan;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/10 border-t border-border/50">
      {/* Parsed Semantics */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">
          Parsed Semantics
        </p>
        {spec ? (
          <div className="space-y-1 text-xs">
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">Entity</span>
              <span className="text-foreground/80 font-mono text-[11px] truncate">
                {Object.values(spec.market.metadata).join(", ") || "—"}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">Type</span>
              <span className="text-foreground/80 font-mono text-[11px]">
                {c.parse_result.metadata.question_type}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">Semantics</span>
              <span className="text-foreground/80 font-mono text-[11px]">
                {renderText(spec.prediction_semantics)}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">Timeframe</span>
              <span className="text-foreground/80 font-mono text-[11px] truncate">
                {formatDate(spec.market.resolution_deadline)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-red-400">Parse failed — no semantics</p>
        )}
      </div>

      {/* Planned Sources */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold">
          Planned Sources & Requirements
        </p>
        {plan ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1">
              {plan.requirements.map((r) => (
                <Badge key={r} variant="outline" className="text-[10px] font-mono">
                  {r}
                </Badge>
              ))}
            </div>
            {plan.sources.length > 0 ? (
              <div className="space-y-0.5">
                {plan.sources.map((s) => (
                  <div key={s.source_id} className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-violet-400 font-mono">{s.provider}</span>
                    <span className="text-muted-foreground">T{s.tier}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-sky-400">Deferred discovery</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No tool plan</p>
        )}
      </div>

      {/* Determinism & Audit */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
          Determinism & Proof
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">created_at:</span>
            {spec?.created_at === null ? (
              <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                Excluded (deterministic)
              </Badge>
            ) : spec?.created_at ? (
              <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/20 bg-amber-500/10">
                Included (non-stable)
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          {c.oracle_result && (
            <>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span className="text-muted-foreground w-20 shrink-0">spec_hash:</span>
                <span className="truncate text-foreground/60">{c.oracle_result.prompt_spec_hash.slice(0, 16)}…</span>
                <InlineCopyButton value={c.oracle_result.prompt_spec_hash} label="spec_hash" />
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span className="text-muted-foreground w-20 shrink-0">por_root:</span>
                <span className="truncate text-foreground/60">{c.oracle_result.por_root.slice(0, 16)}…</span>
                <InlineCopyButton value={c.oracle_result.por_root} label="por_root" />
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span className="text-muted-foreground w-20 shrink-0">evidence:</span>
                <span className="truncate text-foreground/60">{c.oracle_result.evidence_root.slice(0, 16)}…</span>
                <InlineCopyButton value={c.oracle_result.evidence_root} label="evidence_root" />
              </div>
            </>
          )}
          {!c.oracle_result && (
            <p className="text-[11px] text-muted-foreground">Proof artifacts available after oracle run</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Card view ──────────────────────────────────────────────────────────────

function CaseCard({ c, onClick }: { c: MarketCase; onClick: () => void }) {
  const matchStatus = getMatchStatus(c);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:border-primary/30 hover:shadow-md relative overflow-hidden",
        (matchStatus === "MISMATCH" || matchStatus === "VERIFICATION_FAILED") &&
          "border-l-2",
        matchStatus === "MISMATCH" && "border-l-orange-500",
        matchStatus === "VERIFICATION_FAILED" && "border-l-red-500"
      )}
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4 px-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{c.source.title}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{c.source.question}</p>
          </div>
          <MatchIndicator status={matchStatus} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <PlatformBadge platform={c.source.platform} />
          <SourceStatusBadge status={c.source.status} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Official</p>
              <OutcomeBadge outcome={c.source.official_outcome} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Oracle</p>
              {c.oracle_result ? (
                <OutcomeBadge outcome={c.oracle_result.outcome} />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>
          {c.oracle_result && (
            <ConfidenceBar confidence={c.oracle_result.confidence} />
          )}
        </div>
        <AiReadinessCell c={c} />
      </CardContent>
    </Card>
  );
}

// ─── Sort ───────────────────────────────────────────────────────────────────

type SortKey = "confidence" | "updated" | "mismatch";

function sortCases(cases: MarketCase[], sortKey: SortKey): MarketCase[] {
  const sorted = [...cases];
  switch (sortKey) {
    case "confidence":
      return sorted.sort(
        (a, b) =>
          (b.oracle_result?.confidence ?? 0) - (a.oracle_result?.confidence ?? 0)
      );
    case "updated":
      return sorted.sort(
        (a, b) =>
          new Date(b.source.last_updated_at).getTime() -
          new Date(a.source.last_updated_at).getTime()
      );
    case "mismatch":
      return sorted.sort((a, b) => {
        const order: Record<string, number> = {
          MISMATCH: 0,
          VERIFICATION_FAILED: 1,
          PENDING: 2,
          MATCH: 3,
        };
        return (order[getMatchStatus(a)] ?? 9) - (order[getMatchStatus(b)] ?? 9);
      });
    default:
      return sorted;
  }
}

// ─── Main Table ─────────────────────────────────────────────────────────────

interface CaseTableViewProps {
  cases: MarketCase[];
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  // Pagination props (optional - if not provided, no pagination UI shown)
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    isLoading?: boolean;
  };
}

export function CaseTableView({ cases, filters, onFiltersChange, pagination }: CaseTableViewProps) {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  // Client-side filters (needsAttention only — source & match are server-side)
  let filtered = cases;
  if (filters.needsAttention) {
    filtered = filtered.filter(needsAttention);
  }

  filtered = sortCases(filtered, sortKey);

  const totalCols = 10;

  return (
    <div className="space-y-4">
      <CaseFilters filters={filters} onChange={onFiltersChange} />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtered.length} market{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-7 rounded-md border border-border bg-background px-2 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="updated">Last Updated</option>
            <option value="confidence">Confidence (High→Low)</option>
            <option value="mismatch">Attention First</option>
          </select>

          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center transition-colors",
                viewMode === "table"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center transition-colors",
                viewMode === "card"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Card View */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <CaseCard
              key={c.market_id}
              c={c}
              onClick={() => { trackCaseClick(c.market_id); router.push(`/cases/${c.slug}`); }}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-1 px-0"></TableHead>
                  <TableHead className="max-w-[260px]">Market</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Official</TableHead>
                  <TableHead>Oracle</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>
                    <span className="whitespace-nowrap">AI Readiness</span>
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const matchStatus = getMatchStatus(c);
                  const isExpanded = expandedId === c.market_id;

                  return (
                    <>
                      <TableRow
                        key={c.market_id}
                        className="cursor-pointer group relative"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : c.market_id)
                        }
                      >
                        {/* Severity strip */}
                        <TableCell className="w-1 px-0 py-0">
                          <div
                            className={cn(
                              "w-[3px] h-full min-h-[48px] rounded-r-full",
                              severityColor(matchStatus)
                            )}
                          />
                        </TableCell>

                        {/* Market */}
                        <TableCell className="max-w-[260px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {c.source.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {c.source.question}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                trackCaseClick(c.market_id);
                                router.push(`/cases/${c.slug}`);
                              }}
                              className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-accent transition-all shrink-0"
                              title="View detail"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </TableCell>

                        {/* Platform */}
                        <TableCell>
                          <PlatformBadge platform={c.source.platform} />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <SourceStatusBadge status={c.source.status} />
                        </TableCell>

                        {/* Official Outcome */}
                        <TableCell>
                          <OutcomeBadge outcome={c.source.official_outcome} />
                        </TableCell>

                        {/* Oracle Outcome */}
                        <TableCell>
                          {c.oracle_result ? (
                            <OutcomeBadge outcome={c.oracle_result.outcome} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Match */}
                        <TableCell>
                          <MatchIndicator status={matchStatus} />
                        </TableCell>

                        {/* Confidence */}
                        <TableCell>
                          {c.oracle_result ? (
                            <ConfidenceBar confidence={c.oracle_result.confidence} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* AI Readiness */}
                        <TableCell>
                          <AiReadinessCell c={c} />
                        </TableCell>

                        {/* Expand chevron */}
                        <TableCell>
                          <ChevronDown
                            className={cn(
                              "h-3 w-3 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </TableCell>
                      </TableRow>

                      {/* Expanded: AI Preview Panel */}
                      {isExpanded && (
                        <TableRow
                          key={`${c.market_id}-expand`}
                          className="hover:bg-transparent"
                        >
                          <TableCell colSpan={totalCols + 1} className="p-0">
                            <AiPreviewPanel c={c} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={totalCols + 1}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No markets match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              disabled={pagination.isLoading}
              className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            {pagination.isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize) || 1}
              <span className="ml-2 text-xs">({pagination.total} total)</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || pagination.isLoading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize) || pagination.isLoading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
