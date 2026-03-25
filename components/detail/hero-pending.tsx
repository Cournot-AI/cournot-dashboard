"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MarketCase } from "@/lib/types";
import { cn, renderText } from "@/lib/utils";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Shield,
  Info,
} from "lucide-react";


function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function HeroPending({ c }: { c: MarketCase }) {
  const spec = c.parse_result.prompt_spec;
  const plan = c.parse_result.tool_plan;
  const parseOk = c.parse_result.ok;

  return (
    <Card className="border-border/50 overflow-hidden">
      {/* Gradient top accent */}
      <div className="h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-indigo-500" />
      <CardContent className="pt-5 pb-5 space-y-5">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <Brain className="h-4.5 w-4.5 text-violet-400" />
          <h2 className="text-sm font-semibold tracking-tight">AI Interpretation</h2>
          <Badge variant="outline" className="text-[10px] ml-auto text-muted-foreground">
            Pre-resolution
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Column 1: Parsed Semantics */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Parsed Semantics
            </p>
            {spec ? (
              <>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground/70">Event Definition</p>
                    <p className="text-xs text-foreground/80 font-mono leading-relaxed">
                      {renderText(spec.market.event_definition)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground/70">Prediction Type</p>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {renderText(spec.prediction_semantics)}
                    </Badge>
                  </div>
                </div>
                {/* Assumptions */}
                {spec.extra &&
                  Array.isArray((spec.extra as Record<string, unknown>).assumptions) &&
                  ((spec.extra as Record<string, unknown>).assumptions as string[]).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground/70">Key Assumptions</p>
                      {((spec.extra as Record<string, unknown>).assumptions as string[]).map(
                        (a, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-1.5 text-[11px] text-foreground/70"
                          >
                            <Info className="h-3 w-3 text-violet-400 mt-0.5 shrink-0" />
                            <span>{a}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <XCircle className="h-6 w-6 text-red-400/60 mb-1.5" />
                <p className="text-xs text-red-400 font-medium">Parse failed</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {c.parse_result.error?.slice(0, 80)}...
                </p>
              </div>
            )}
          </div>

          {/* Column 2: Evidence Schedule + ToolPlan Summary */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Evidence Schedule
            </p>
            {plan ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3 text-blue-400" />
                    <p className="text-xs">
                      {plan.sources.length > 0 ? (
                        <>
                          <span className="text-foreground font-medium">{plan.sources.length}</span>
                          <span className="text-muted-foreground"> sources planned</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Deferred source discovery</span>
                      )}
                    </p>
                  </div>
                  {plan.sources.length > 0 ? (
                    <div className="space-y-1">
                      {plan.sources.map((s) => (
                        <div key={s.source_id} className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-violet-400 text-[11px]">{s.provider}</span>
                          <span className="text-muted-foreground text-[10px] ml-auto">Tier {s.tier}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2">
                      <p className="text-[11px] text-sky-400">
                        Sources will be discovered at resolve time
                      </p>
                    </div>
                  )}
                </div>
                <div className="pt-1 border-t border-border/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Requirements:</span>
                    <div className="flex gap-1">
                      {plan.requirements.map((r) => (
                        <Badge key={r} variant="outline" className="text-[10px] font-mono">{r}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Fallbacks:</span>
                    <span className={plan.allow_fallbacks ? "text-emerald-400" : "text-red-400"}>
                      {plan.allow_fallbacks ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Clock className="h-6 w-6 text-muted-foreground/40 mb-1.5" />
                <p className="text-xs text-muted-foreground">No tool plan available</p>
              </div>
            )}
          </div>

          {/* Column 3: Readiness & Determinism */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Readiness & Determinism
            </p>
            <div className="space-y-2">
              {/* Readiness indicators */}
              <div className="flex items-center gap-2">
                {parseOk ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                )}
                <span className="text-xs">Spec parsed</span>
              </div>
              <div className="flex items-center gap-2">
                {plan ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                )}
                <span className="text-xs">Tool plan generated</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-muted-foreground">Oracle not yet executed</span>
              </div>
            </div>

            {/* Determinism badge */}
            {spec && (
              <div className="pt-2 border-t border-border/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-xs font-medium">Determinism</span>
                </div>
                {spec.created_at === null ? (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                    <p className="text-[11px] text-emerald-400">
                      Hash-stable: <code className="font-mono">created_at</code> excluded
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                    <p className="text-[11px] text-amber-400">
                      <code className="font-mono">created_at</code> present — not hash-stable
                    </p>
                  </div>
                )}
                {spec && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Strict mode:</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        c.parse_result.metadata.strict_mode
                          ? "text-blue-400 border-blue-500/20"
                          : "text-slate-400"
                      )}
                    >
                      {c.parse_result.metadata.strict_mode ? "ON" : "OFF"}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Resolution timeline hint */}
            <div className="pt-2 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground/70">Resolution Deadline</p>
              <p className="text-xs font-mono text-foreground/80">
                {formatDate(c.source.resolution_deadline)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
