"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Shield,
  Gauge,
  Tag,
  Lightbulb,
  Globe,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CheckFailed {
  check_id: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

interface RiskFactor {
  factor: string;
  points: number;
}

interface SourceReachability {
  url: string;
  reachable: boolean;
  status_code: number | null;
  error: string | null;
}

export interface ValidationResult {
  ok: boolean;
  classification: {
    market_type: string;
    confidence: number;
    detection_rationale: string;
  };
  validation: {
    checks_passed: string[];
    checks_failed: CheckFailed[];
  };
  resolvability: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
    risk_factors: RiskFactor[];
    recommendation: string;
  };
  source_reachability?: SourceReachability[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  LOW: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    label: "Low Risk",
  },
  MEDIUM: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    label: "Medium Risk",
  },
  HIGH: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    label: "High Risk",
  },
  VERY_HIGH: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    label: "Very High Risk",
  },
};

function severityIcon(severity: string) {
  if (severity === "error") return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
  if (severity === "warning") return <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
  return <AlertTriangle className="h-3.5 w-3.5 text-sky-400 shrink-0" />;
}

function severityColor(severity: string) {
  if (severity === "error") return "border-red-500/20 bg-red-500/5";
  if (severity === "warning") return "border-yellow-500/20 bg-yellow-500/5";
  return "border-sky-500/20 bg-sky-500/5";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ValidationCard({ result }: { result: ValidationResult }) {
  const [expanded, setExpanded] = useState(true);

  const { classification, validation, resolvability, source_reachability } = result;
  const unreachableSources = (source_reachability ?? []).filter((s) => !s.reachable);
  const levelCfg = LEVEL_CONFIG[resolvability.level] ?? LEVEL_CONFIG.MEDIUM;

  const hasIssues = validation.checks_failed.length > 0;
  const errorCount = validation.checks_failed.filter((c) => c.severity === "error").length;
  const warningCount = validation.checks_failed.filter((c) => c.severity === "warning").length;

  return (
    <Card className={cn("border-border/50", hasIssues && "border-yellow-500/20")}>
      <CardHeader className="pb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Shield className={cn("h-4 w-4", hasIssues ? "text-yellow-400" : "text-emerald-400")} />
            <CardTitle className="text-sm">Market Validation</CardTitle>
            {!hasIssues && (
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20">
                All checks passed
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/20">
                {errorCount} error{errorCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="text-[10px] text-yellow-400 border-yellow-500/20">
                {warningCount} warning{warningCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform shrink-0",
              expanded && "rotate-180"
            )}
          />
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-2">
          {/* Top row: Classification + Resolvability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Classification */}
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Market Type
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">
                  {classification.market_type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(classification.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {classification.detection_rationale}
              </p>
            </div>

            {/* Resolvability */}
            <div className={cn("rounded-lg border p-3 space-y-2", levelCfg.border, levelCfg.bg)}>
              <div className="flex items-center gap-1.5">
                <Gauge className={cn("h-3 w-3", levelCfg.color)} />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Resolvability
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-2xl font-bold font-mono", levelCfg.color)}>
                  {resolvability.score}
                </span>
                <Badge variant="outline" className={cn("text-xs", levelCfg.color, levelCfg.border)}>
                  {levelCfg.label}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {resolvability.recommendation}
              </p>
            </div>
          </div>

          {/* Checks passed */}
          {validation.checks_passed.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Checks Passed ({validation.checks_passed.length})
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {validation.checks_passed.map((id) => (
                  <Badge
                    key={id}
                    variant="outline"
                    className="text-[10px] font-mono text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                  >
                    {id}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Checks failed */}
          {validation.checks_failed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-yellow-400" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Issues Found ({validation.checks_failed.length})
                </p>
              </div>
              <div className="space-y-2">
                {validation.checks_failed.map((check, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-lg border p-3 space-y-1.5",
                      severityColor(check.severity)
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {severityIcon(check.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {check.check_id}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              check.severity === "error"
                                ? "text-red-400 border-red-500/20"
                                : check.severity === "warning"
                                  ? "text-yellow-400 border-yellow-500/20"
                                  : "text-sky-400 border-sky-500/20"
                            )}
                          >
                            {check.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                          {check.message}
                        </p>
                      </div>
                    </div>
                    {check.suggestion && (
                      <div className="flex items-start gap-2 ml-5.5 mt-1 rounded-md bg-muted/30 px-2.5 py-2">
                        <Lightbulb className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-violet-300 leading-relaxed">
                          {check.suggestion}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source reachability */}
          {unreachableSources.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-red-400" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Unreachable Sources ({unreachableSources.length})
                </p>
              </div>
              <div className="space-y-1.5">
                {unreachableSources.map((src, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                      <span className="text-xs font-mono text-foreground/80 truncate">
                        {src.url}
                      </span>
                      {src.status_code && (
                        <Badge variant="outline" className="text-[10px] font-mono text-red-400 border-red-500/20 shrink-0">
                          {src.status_code}
                        </Badge>
                      )}
                    </div>
                    {src.error && (
                      <p className="text-[11px] text-red-300/80 ml-5">
                        {src.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk factors */}
          {resolvability.risk_factors.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Risk Factors
              </p>
              <div className="space-y-1">
                {resolvability.risk_factors.map((rf, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs rounded-md bg-muted/20 px-2.5 py-1.5"
                  >
                    <span className="text-foreground/70">{rf.factor}</span>
                    <span className={cn("font-mono text-[11px]", levelCfg.color)}>
                      +{rf.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
