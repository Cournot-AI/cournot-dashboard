"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReasoningStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Brain, ArrowDown } from "lucide-react";

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

export function ReasoningTraceCard({
  steps,
  evidenceSummary,
  reasoningSummary,
}: {
  steps: ReasoningStep[];
  evidenceSummary?: string;
  reasoningSummary?: string;
}) {
  if (steps.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400" />
          <CardTitle className="text-sm">Reasoning Trace</CardTitle>
          <Badge variant="outline" className="text-[10px] ml-auto text-muted-foreground">
            {steps.length} steps
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summaries */}
        {(evidenceSummary || reasoningSummary) && (
          <div className="space-y-3">
            {evidenceSummary && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Evidence Summary
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {evidenceSummary}
                </p>
              </div>
            )}
            {reasoningSummary && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Reasoning Summary
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {reasoningSummary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step-by-step trace */}
        <div className="space-y-0">
          {steps.map((step, i) => {
            const cfg = stepTypeConfig[step.step_type] ?? {
              color: "text-slate-400",
              bg: "bg-slate-500",
              label: step.step_type,
            };
            return (
              <div key={step.step_id} className="flex items-stretch gap-0">
                {/* Connector */}
                <div className="flex flex-col items-center w-6 shrink-0">
                  {i > 0 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-background",
                      cfg.bg
                    )}
                  />
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-4 pl-2">
                  <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] capitalize", cfg.color)}
                      >
                        {cfg.label}
                      </Badge>
                      <span className="text-xs font-medium flex-1 min-w-0 truncate">
                        {step.description}
                      </span>
                      {step.confidence_delta !== 0 && (
                        <span
                          className={cn(
                            "text-[10px] font-mono shrink-0",
                            step.confidence_delta > 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          )}
                        >
                          {step.confidence_delta > 0 ? "+" : ""}
                          {step.confidence_delta.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {step.conclusion}
                    </p>
                    {step.depends_on.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <ArrowDown className="h-2.5 w-2.5" />
                        depends on: {step.depends_on.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
