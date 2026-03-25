import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { MarketCase } from "@/lib/types";
import { cn, renderText, normalizeRules, normalizeSources } from "@/lib/utils";
import { Brain, Info, AlertTriangle, Shield } from "lucide-react";

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

export function PillarUnderstanding({ c }: { c: MarketCase }) {
  const spec = c.parse_result.prompt_spec;
  if (!spec) return null;

  const m = spec.market;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400" />
          AI Understanding
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          How the oracle interpreted the market question
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Event definition */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Event Definition
          </p>
          <div className="rounded-lg bg-muted/30 border border-border p-3 font-mono text-xs text-foreground/80 leading-relaxed">
            {renderText(m.event_definition)}
          </div>
        </div>

        {/* Resolution timeline */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Resolution Timeline
          </p>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500 rounded-full" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <div>
                <p className="font-medium text-foreground/70">Window Start</p>
                <p>{formatDate(m.resolution_window.start)}</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground/70">Deadline</p>
                <p>{formatDate(m.resolution_deadline)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground/70">Window End</p>
                <p>{formatDate(m.resolution_window.end)}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Resolution rules */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Resolution Rules
          </p>
          <div className="space-y-1.5">
            {normalizeRules(m.resolution_rules)
              .sort((a, b) => a.priority - b.priority)
              .map((rule) => (
                <div
                  key={rule.rule_id}
                  className="flex items-start gap-2 rounded-lg bg-muted/20 border border-border/50 px-3 py-2"
                >
                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5 font-mono">
                    {rule.rule_id}
                  </Badge>
                  <p className="text-xs text-foreground/80">{rule.description}</p>
                  <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                    P{rule.priority}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <Separator />

        {/* Dispute & sources row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Dispute Policy
            </p>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Window:</span>
                <span className="font-mono">
                  {Math.round(m.dispute_policy.dispute_window_seconds / 3600)}h
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  m.dispute_policy.allow_challenges
                    ? "text-emerald-400 border-emerald-500/20"
                    : "text-red-400 border-red-500/20"
                )}
              >
                {m.dispute_policy.allow_challenges ? "Challenges Allowed" : "No Challenges"}
              </Badge>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Allowed Sources
            </p>
            <div className="flex flex-wrap gap-1">
              {normalizeSources(m.allowed_sources).map((s) => (
                <Badge key={s} variant="outline" className="text-[10px] font-mono capitalize">
                  {s}
                </Badge>
              ))}
              <Badge variant="outline" className="text-[10px] font-mono">
                Tier ≥ {m.min_provenance_tier}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Assumptions */}
        {spec.extra &&
          Array.isArray((spec.extra as Record<string, unknown>).assumptions) &&
          ((spec.extra as Record<string, unknown>).assumptions as string[]).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Key Assumptions
              </p>
              <div className="space-y-1">
                {((spec.extra as Record<string, unknown>).assumptions as string[]).map(
                  (a, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-lg bg-violet-500/5 border border-violet-500/20 px-3 py-2"
                    >
                      <Info className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground/80">{a}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        <Separator />

        {/* Forbidden behaviors */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Forbidden Behaviors
          </p>
          {spec.forbidden_behaviors.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {spec.forbidden_behaviors.map((b) => (
                <Badge
                  key={b}
                  variant="outline"
                  className="text-[10px] font-mono text-red-400/80 border-red-500/20"
                >
                  {b}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">None specified</p>
          )}
        </div>

        {/* Determinism note */}
        {spec.created_at === null ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
            <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-emerald-400">
              Deterministic: <code className="font-mono">created_at</code> excluded from hash
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-400">
              <code className="font-mono">created_at</code> included ({formatDate(spec.created_at)}) — not hash-stable
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
