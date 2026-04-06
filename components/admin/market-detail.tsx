"use client";

import type { AdminMarket, MarketClassification, MarketExternalData, MarketImpact } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function statusBadge(market: AdminMarket) {
  switch (market.status) {
    case "conflict":
      return <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400">Conflict</Badge>;
    case "monitoring":
      return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400">Monitoring</Badge>;
    case "pending_verification":
      return <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400">Pending Verification</Badge>;
    case "resolved":
      return <Badge variant="outline" className="text-xs text-muted-foreground">Resolved</Badge>;
    case "closed":
      return <Badge variant="outline" className="text-xs bg-gray-500/10 text-gray-400">Closed</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{market.status}</Badge>;
  }
}

function parseEntityRoles(raw: string): Record<string, string> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export function MarketDetail({ market, classification, actions }: { market: AdminMarket; classification?: MarketClassification | null; actions?: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg font-semibold truncate">{market.title}</h2>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant="outline" className={cn("text-[10px]", market.market_timing_type === "time_based" ? "bg-cyan-500/10 text-cyan-400" : market.market_timing_type === "event_based" ? "bg-orange-500/10 text-orange-400" : "text-muted-foreground")}>
              {market.market_timing_type || "unset"}
            </Badge>
            {market.source && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                {market.source}
              </Badge>
            )}
            {statusBadge(market)}
            {market.ai_outcome && (
              <Badge variant="outline" className={cn("text-xs", {
                "bg-green-500/10 text-green-400": market.ai_outcome === "YES",
                "bg-red-500/10 text-red-400": market.ai_outcome === "NO",
                "bg-yellow-500/10 text-yellow-500": market.ai_outcome === "INVALID",
                "bg-purple-500/10 text-purple-400": !["YES", "NO", "INVALID"].includes(market.ai_outcome),
              })}>
                AI: {market.ai_outcome}
              </Badge>
            )}
            {actions}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-2">{market.description}</p>
        {market.platform_url && (
          <a
            href={market.platform_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            View on platform <ExternalLink className="h-3 w-3" />
          </a>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mt-4 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Start</span>
            <p>{formatDate(market.start_time)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">End</span>
            <p>{formatDate(market.end_time)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Expected Resolve</span>
            <p>{market.expected_resolve_time ? formatDate(market.expected_resolve_time) : "—"}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Market Resolved</span>
            <p>{market.ai_result_time ? formatDate(market.ai_result_time) : "—"}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">First AI Notification</span>
            <p className={market.resolve_time ? "text-amber-400" : ""}>
              {market.resolve_time ? formatDate(market.resolve_time) : "—"}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Created By</span>
            <p className="font-mono text-xs truncate">{market.user_id}</p>
          </div>
        </div>

        {classification && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Classification</span>
            <Badge variant="outline" className="text-[10px]">{classification.category}</Badge>
            {classification.subcategory && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">{classification.subcategory}</Badge>
            )}
            {Object.entries(parseEntityRoles(classification.entity_roles)).map(([role, entity]) => (
              <span key={role} className="text-[11px] text-muted-foreground">
                <span className="text-muted-foreground/60">{role}:</span>{" "}
                <span className="text-foreground">{entity}</span>
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── External Data Section ──

function safeParseJson(raw: string): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function ExternalDataItem({ d }: { d: MarketExternalData }) {
  const entities = safeParseJson(d.entities) as string[] | null;
  const payload = safeParseJson(d.data);

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className="text-[10px] shrink-0">{d.source_name}</Badge>
          <span className="text-sm font-medium truncate">{d.title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={cn("text-[10px]", d.event_concluded ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400")}
          >
            {d.event_concluded ? "Concluded" : "In Progress"}
          </Badge>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {d.match_type}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              d.relevance_score >= 0.8 ? "text-green-400" : d.relevance_score >= 0.5 ? "text-amber-400" : "text-muted-foreground"
            )}
          >
            relevance {d.relevance_score.toFixed(2)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">External ID</span>
          <p className="font-mono">{d.external_id}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Event Time</span>
          <p>{d.event_time ? formatDate(d.event_time) : "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Fetched</span>
          <p>{d.fetched_time ? formatDate(d.fetched_time) : "—"}</p>
        </div>
      </div>

      {entities && entities.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Entities</span>
          {entities.map((e, i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">{e}</Badge>
          ))}
        </div>
      )}

      {payload !== null && (
        <details>
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
            Raw data payload
          </summary>
          <pre className="mt-2 rounded-lg bg-muted/30 p-3 text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-[300px] overflow-y-auto">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

export function ExternalDataSection({ data }: { data: MarketExternalData[] }) {
  const sorted = [...data].sort((a, b) => b.relevance_score - a.relevance_score);
  const top = sorted[0];
  const rest = sorted.slice(1);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4">External Data</h3>
        <div className="space-y-4">
          <ExternalDataItem d={top} />
          {rest.length > 0 && (
            <details>
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                {rest.length} more source{rest.length > 1 ? "s" : ""}
              </summary>
              <div className="space-y-4 mt-4">
                {rest.map((d) => (
                  <ExternalDataItem key={d.id} d={d} />
                ))}
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Event Impacts Section ──

function ImpactItem({ impact }: { impact: MarketImpact }) {
  const ev = impact.canonical_event;
  const isUp = impact.direction === "up";
  const deltaColor = isUp ? "text-green-400" : "text-red-400";

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className="text-[10px] shrink-0">{impact.impact_type}</Badge>
          <span className={cn("inline-flex items-center gap-0.5 text-sm font-medium", deltaColor)}>
            {isUp ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
            {(impact.probability_delta >= 0 ? "+" : "")}{(impact.probability_delta * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              impact.confidence >= 0.8 ? "text-green-400" : impact.confidence >= 0.5 ? "text-amber-400" : "text-muted-foreground"
            )}
          >
            confidence {impact.confidence.toFixed(2)}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{formatDate(impact.created_time)}</span>
        </div>
      </div>

      {impact.evidence_summary && (
        <p className="text-xs text-muted-foreground">{impact.evidence_summary}</p>
      )}

      {/* Canonical Event */}
      <div className="rounded-md border border-border/60 bg-muted/10 p-3 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-sm font-medium">{ev.title}</span>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px]">{ev.vertical}</Badge>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">{ev.event_type}</Badge>
            <Badge
              variant="outline"
              className={cn("text-[10px]", ev.is_active ? "bg-green-500/10 text-green-400" : "bg-muted/20 text-muted-foreground")}
            >
              {ev.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        {ev.summary && (
          <p className="text-xs text-muted-foreground">{ev.summary}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Event Time</span>
            <p>{ev.event_time ? formatDate(ev.event_time) : "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Evidence Count</span>
            <p>{ev.evidence_count}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Last Updated</span>
            <p>{ev.last_updated ? formatDate(ev.last_updated) : "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImpactsSection({ impacts }: { impacts: MarketImpact[] }) {
  const [first, ...rest] = impacts;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4">Event Impacts</h3>
        <div className="space-y-4">
          <ImpactItem impact={first} />
          {rest.length > 0 && (
            <details>
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                {rest.length} more impact{rest.length > 1 ? "s" : ""}
              </summary>
              <div className="space-y-4 mt-4">
                {rest.map((impact) => (
                  <ImpactItem key={impact.id} impact={impact} />
                ))}
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
