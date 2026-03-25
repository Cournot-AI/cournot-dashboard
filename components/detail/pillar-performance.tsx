import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { MarketCase, ReasoningStep, ExecutionStep } from "@/lib/types";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfidenceBreakdownCard } from "@/components/shared/confidence-bar";
import {
  Gauge,
  Timer,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  ArrowRight,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${(s / 60).toFixed(1)}m`;
}

function formatLatency(oracleAt: string, resolvedAt: string | null): string {
  if (!resolvedAt) return "—";
  const delta = Math.abs(
    new Date(oracleAt).getTime() - new Date(resolvedAt).getTime()
  );
  const s = delta / 1000;
  if (s < 60) return `${s.toFixed(0)}s`;
  const m = s / 60;
  if (m < 60) return `${m.toFixed(0)}m`;
  return `${(m / 60).toFixed(1)}h`;
}

export function PillarPerformance({ c }: { c: MarketCase }) {
  const oracle = c.oracle_result;
  const plan = c.parse_result.tool_plan;

  if (!oracle) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-400" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState type="pending" />
        </CardContent>
      </Card>
    );
  }

  const checks = oracle.checks ?? [];
  const passingChecks = checks.filter((ch) => ch.status === "pass").length;
  const failingChecks = checks.filter((ch) => ch.status === "fail").length;
  const warnChecks = checks.filter((ch) => ch.status === "warn").length;
  const resolveLatency = formatLatency(
    oracle.executed_at,
    c.source.official_resolved_at
  );

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4 text-blue-400" />
          Performance
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Execution metrics and check results
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Timer className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Duration
              </p>
            </div>
            <p className="text-lg font-bold font-mono tabular-nums text-sky-400">
              {formatDuration(oracle.duration_ms)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Database className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sources
              </p>
            </div>
            <p className="text-lg font-bold font-mono tabular-nums text-violet-400">
              {plan?.sources.length ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Resolve Latency
            </p>
            <p className="text-lg font-bold font-mono tabular-nums text-sky-400">
              {resolveLatency}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Checks
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                {passingChecks}
              </span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-lg font-bold font-mono tabular-nums text-foreground/60">
                {checks.length}
              </span>
            </div>
          </div>
        </div>

        {/* Check results list */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Check Results ({checks.length})
          </p>
          <div className="space-y-1">
            {checks.map((check) => {
              const icons = {
                pass: { icon: CheckCircle2, color: "text-emerald-400" },
                fail: { icon: XCircle, color: "text-red-400" },
                warn: { icon: AlertTriangle, color: "text-yellow-400" },
                skip: { icon: MinusCircle, color: "text-slate-400" },
              };
              const cfg = icons[check.status];
              const Icon = cfg.icon;

              return (
                <div
                  key={check.check_id}
                  className="flex items-center gap-2.5 rounded-lg border border-border/50 px-3 py-2"
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
                  <span className="text-xs font-medium flex-1">{check.name}</span>
                  <span className="text-[10px] text-muted-foreground max-w-[250px] truncate">
                    {check.message}
                  </span>
                  {check.requirement_id && (
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                      {check.requirement_id}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {passingChecks > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {passingChecks} passed
            </span>
          )}
          {failingChecks > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {failingChecks} failed
            </span>
          )}
          {warnChecks > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              {warnChecks} warnings
            </span>
          )}
        </div>

        {/* Execution waterfall */}
        {oracle.execution_steps && oracle.execution_steps.length > 0 && (
          <>
            <Separator />
            <ExecutionWaterfall steps={oracle.execution_steps} />
          </>
        )}

        {/* Reasoning chain */}
        {oracle.reasoning_steps && oracle.reasoning_steps.length > 0 && (
          <>
            <Separator />
            <ReasoningChain steps={oracle.reasoning_steps} />
          </>
        )}

        {/* Confidence breakdown */}
        {oracle.confidence_breakdown && (
          <>
            <Separator />
            <ConfidenceBreakdownCard breakdown={oracle.confidence_breakdown} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Execution Waterfall ──────────────────────────────────────────────────

const stepTypeConfig: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  validity_check: {
    color: "text-blue-400",
    bg: "bg-blue-500",
    label: "Validity",
  },
  evidence_analysis: {
    color: "text-violet-400",
    bg: "bg-violet-500",
    label: "Analysis",
  },
  rule_application: {
    color: "text-emerald-400",
    bg: "bg-emerald-500",
    label: "Rule",
  },
  confidence_assessment: {
    color: "text-amber-400",
    bg: "bg-amber-500",
    label: "Confidence",
  },
};

function ExecutionWaterfall({ steps }: { steps: ExecutionStep[] }) {
  const maxLatency = Math.max(...steps.map((s) => s.latency_ms), 1);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Execution Waterfall
      </p>
      <div className="space-y-1.5">
        {steps.map((step, i) => {
          const pct = Math.max((step.latency_ms / maxLatency) * 100, 4);
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2"
            >
              <Globe
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  step.success ? "text-emerald-400" : "text-red-400"
                )}
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono shrink-0"
                  >
                    {step.tool}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    {step.uri}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      step.success ? "bg-sky-500" : "bg-red-500"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-mono text-muted-foreground shrink-0 tabular-nums w-16 text-right">
                {step.latency_ms}ms
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reasoning Chain ──────────────────────────────────────────────────────

function ReasoningChain({ steps }: { steps: ReasoningStep[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Reasoning Chain
      </p>
      <div className="space-y-0">
        {steps.map((step, i) => {
          const cfg = stepTypeConfig[step.step_type] ?? {
            color: "text-slate-400",
            bg: "bg-slate-500",
            label: step.step_type,
          };
          return (
            <div key={step.step_id} className="flex items-stretch gap-0">
              {/* Connector line */}
              <div className="flex flex-col items-center w-6 shrink-0">
                <div
                  className={cn("h-3 w-3 rounded-full shrink-0 mt-3", cfg.bg)}
                />
                {i < steps.length - 1 && (
                  <div className="flex-1 w-px bg-border" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0 pb-3 pl-2">
                <div className="rounded-lg border border-border/50 px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-mono",
                        cfg.color,
                        "border-current/20"
                      )}
                    >
                      {cfg.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {step.step_id}
                    </span>
                    {step.confidence_delta !== 0 && (
                      <span
                        className={cn(
                          "text-[10px] font-mono ml-auto",
                          step.confidence_delta > 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        )}
                      >
                        {step.confidence_delta > 0 ? "+" : ""}
                        {Math.round(step.confidence_delta * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/80">
                    {step.description}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-xs font-medium text-foreground/90">
                      {step.conclusion}
                    </p>
                  </div>
                  {step.depends_on.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>Depends on:</span>
                      {step.depends_on.map((d) => (
                        <Badge
                          key={d}
                          variant="outline"
                          className="text-[10px] font-mono"
                        >
                          {d}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
