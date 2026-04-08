"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ExternalLink, ShieldCheck, AlertTriangle, Hash, Clock,
  ChevronRight, FileText, Brain, Search,
} from "lucide-react";

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function tierLabel(tier: number): string {
  switch (tier) {
    case 1: return "Tier 1 (Authoritative)";
    case 2: return "Tier 2 (Reliable)";
    case 3: return "Tier 3 (General)";
    default: return `Tier ${tier}`;
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

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "text-green-400";
  if (confidence >= 0.5) return "text-yellow-400";
  return "text-red-400";
}

interface Props {
  aiResult: string;
  aiPrompt?: string;
  resolveReasoning?: string;
}

export function AiResultDetail({ aiResult, aiPrompt, resolveReasoning }: Props) {
  let result: any = null;
  let prompt: any = null;

  try { result = JSON.parse(aiResult); } catch { return null; }
  try { if (aiPrompt) prompt = JSON.parse(aiPrompt); } catch { /* ignore */ }

  const verdict = result?.artifacts?.verdict;
  const reasoning = result?.artifacts?.reasoning_trace;
  const bundles = result?.artifacts?.evidence_bundles ?? [];
  const porBundle = result?.artifacts?.por_bundle;
  const validation = prompt?.validation;
  const classification = prompt?.classification;
  const resolvability = prompt?.resolvability;
  const promptSpec = prompt?.prompt_spec;

  return (
    <div className="space-y-4">
      {/* ── Verdict Overview ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">AI Verdict</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Outcome</span>
              <p className={cn("text-2xl font-bold", {
                "text-green-400": result.outcome === "YES",
                "text-red-400": result.outcome === "NO",
                "text-yellow-400": result.outcome === "INVALID",
              })}>
                {result.outcome}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Confidence</span>
              <p className={cn("text-2xl font-bold", confidenceColor(result.confidence))}>
                {(result.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Market ID</span>
              <p className="font-mono text-xs mt-1">{result.market_id}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">PoR Root</span>
              <p className="font-mono text-xs mt-1 truncate" title={result.por_root}>
                {result.por_root}
              </p>
            </div>
          </div>

          {/* Justification */}
          {verdict?.metadata?.justification && (
            <details open className="mt-4">
              <summary className="text-xs text-primary cursor-pointer flex items-center gap-1">
                <FileText className="h-3 w-3" /> Full Justification
              </summary>
              <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap bg-muted/20 rounded-lg p-3 max-h-[400px] overflow-y-auto">
                {verdict.metadata.justification}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>

      {/* ── Human Resolve Reasoning ── */}
      {resolveReasoning && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400">Resolution Reasoning</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{resolveReasoning}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Evidence Bundles ── */}
      {bundles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">
                Evidence ({bundles.reduce((n: number, b: any) => n + (b.items?.length ?? 0), 0)} items across {bundles.length} bundle{bundles.length > 1 ? "s" : ""})
              </h3>
            </div>

            <div className="space-y-6">
              {bundles.map((bundle: any, bi: number) => (
                <div key={bi} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{bundle.collector_name}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {bundle.items?.length ?? 0} items
                    </span>
                  </div>

                  {(bundle.items ?? []).map((item: any, ii: number) => {
                    const ef = item.extracted_fields;
                    if (!ef) return null;
                    const sources = ef.evidence_sources ?? [];

                    return (
                      <div key={ii} className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
                        {/* Item header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={cn("text-[10px]", {
                                "bg-green-500/10 text-green-400": ef.outcome === "Yes" || ef.outcome === "YES",
                                "bg-red-500/10 text-red-400": ef.outcome === "No" || ef.outcome === "NO",
                                "bg-yellow-500/10 text-yellow-500": ef.resolution_status === "UNRESOLVED",
                              })}>
                                {ef.outcome ?? ef.resolution_status ?? "Unknown"}
                              </Badge>
                              {ef.confidence_score != null && (
                                <span className={cn("text-xs font-medium", confidenceColor(ef.confidence_score))}>
                                  {(ef.confidence_score * 100).toFixed(0)}% confidence
                                </span>
                              )}
                              {item.provenance?.source_uri && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  via {item.provenance.source_uri}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDate(item.provenance?.fetched_at)}
                          </span>
                        </div>

                        {/* Reason */}
                        {ef.reason && (
                          <details open={sources.length > 0}>
                            <summary className="text-xs text-primary cursor-pointer">Evidence reasoning</summary>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                              {ef.reason}
                            </p>
                          </details>
                        )}

                        {/* Evidence Sources */}
                        {sources.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Sources ({sources.length})
                            </p>
                            {sources.map((src: any, si: number) => (
                              <div
                                key={si}
                                className="rounded-md border border-border/50 bg-background/50 p-3 text-xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Badge variant="outline" className={cn("text-[10px] shrink-0", tierColor(src.credibility_tier))}>
                                      {tierLabel(src.credibility_tier)}
                                    </Badge>
                                    <span className="font-medium truncate">{src.domain_name}</span>
                                    {src.supports && (
                                      <Badge variant="outline" className={cn("text-[10px] shrink-0", {
                                        "bg-green-500/10 text-green-400": src.supports === "YES",
                                        "bg-red-500/10 text-red-400": src.supports === "NO",
                                      })}>
                                        {src.supports}
                                      </Badge>
                                    )}
                                  </div>
                                  {src.url && (
                                    <a
                                      href={src.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline shrink-0"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                                {src.key_fact && (
                                  <p className="text-muted-foreground mt-2 leading-relaxed">
                                    {src.key_fact}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Search queries used */}
                        {ef.grounding_search_queries?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {ef.grounding_search_queries.map((q: string, qi: number) => (
                              <Badge key={qi} variant="outline" className="text-[10px] text-muted-foreground">
                                <Search className="h-2.5 w-2.5 mr-1" />{q}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Reasoning Trace ── */}
      {reasoning?.steps?.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">
                Reasoning Trace ({reasoning.steps.length} steps)
              </h3>
            </div>

            {reasoning.evidence_summary && (
              <div className="rounded-lg bg-muted/20 p-3 mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Evidence Summary</p>
                <p className="text-sm text-muted-foreground">{reasoning.evidence_summary}</p>
              </div>
            )}

            {reasoning.reasoning_summary && (
              <div className="rounded-lg bg-muted/20 p-3 mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Reasoning Summary</p>
                <p className="text-sm text-muted-foreground">{reasoning.reasoning_summary}</p>
              </div>
            )}

            <div className="space-y-2">
              {reasoning.steps.map((step: any) => (
                <details key={step.step_id} className="rounded-lg border border-border/50 bg-muted/10">
                  <summary className="p-3 cursor-pointer text-xs flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 shrink-0 transition-transform [[open]>&]:rotate-90" />
                    <span className="font-mono text-muted-foreground">{step.step_id}</span>
                    <Badge variant="outline" className="text-[10px]">{step.step_type}</Badge>
                    {step.rule_id && (
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400">{step.rule_id}</Badge>
                    )}
                    <span className="flex-1 truncate text-muted-foreground">{step.conclusion}</span>
                    {step.confidence_delta !== 0 && (
                      <span className={cn("text-[10px] font-mono shrink-0", {
                        "text-green-400": step.confidence_delta > 0,
                        "text-red-400": step.confidence_delta < 0,
                      })}>
                        {step.confidence_delta > 0 ? "+" : ""}{step.confidence_delta}
                      </span>
                    )}
                  </summary>
                  <div className="px-3 pb-3 text-xs text-muted-foreground space-y-1 border-t border-border/30 pt-2">
                    {step.description && <p><span className="font-medium">Description:</span> {step.description}</p>}
                    {step.input_summary && <p><span className="font-medium">Input:</span> {step.input_summary}</p>}
                    {step.output_summary && <p><span className="font-medium">Output:</span> {step.output_summary}</p>}
                  </div>
                </details>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Prompt Validation & Classification ── */}
      {prompt && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">Prompt Analysis</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
              {classification && (
                <div>
                  <span className="text-xs text-muted-foreground">Market Type</span>
                  <p className="font-medium">{classification.market_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {(classification.confidence * 100).toFixed(0)}% confidence
                  </p>
                </div>
              )}
              {resolvability && (
                <div>
                  <span className="text-xs text-muted-foreground">Resolvability</span>
                  <p className={cn("font-medium", {
                    "text-green-400": resolvability.level === "VERY_HIGH" || resolvability.level === "HIGH",
                    "text-yellow-400": resolvability.level === "MEDIUM",
                    "text-red-400": resolvability.level === "LOW",
                  })}>
                    {resolvability.level} ({resolvability.score}/100)
                  </p>
                </div>
              )}
              {promptSpec?.market?.event_definition && (
                <div>
                  <span className="text-xs text-muted-foreground">Event Definition</span>
                  <p className="text-xs">{promptSpec.market.event_definition}</p>
                </div>
              )}
            </div>

            {/* Risk Factors */}
            {resolvability?.risk_factors?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Risk Factors</p>
                <div className="flex flex-wrap gap-1">
                  {resolvability.risk_factors.map((rf: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px] text-yellow-500">
                      {rf.factor} (-{rf.points}pts)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Checks */}
            {validation && (
              <div className="space-y-2">
                {validation.checks_failed?.length > 0 && (
                  <details>
                    <summary className="text-xs cursor-pointer flex items-center gap-1 text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      {validation.checks_failed.length} validation warning{validation.checks_failed.length > 1 ? "s" : ""}
                    </summary>
                    <div className="mt-2 space-y-1">
                      {validation.checks_failed.map((c: any, i: number) => (
                        <div key={i} className="rounded-md bg-amber-500/5 border border-amber-500/20 p-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{c.check_id}</Badge>
                            <Badge variant="outline" className={cn("text-[10px]", {
                              "text-red-400": c.severity === "error",
                              "text-yellow-500": c.severity === "warning",
                            })}>
                              {c.severity}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mt-1">{c.message}</p>
                          {c.suggestion && (
                            <p className="text-muted-foreground/70 mt-0.5 italic">{c.suggestion}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                {validation.checks_passed?.length > 0 && (
                  <p className="text-xs text-green-400">
                    {validation.checks_passed.length} check{validation.checks_passed.length > 1 ? "s" : ""} passed: {validation.checks_passed.join(", ")}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Cryptographic Roots ── */}
      {porBundle && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Hash className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">Cryptographic Proofs</h3>
              {porBundle.metadata?.pipeline_version && (
                <Badge variant="outline" className="text-[10px]">
                  Pipeline {porBundle.metadata.pipeline_version}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {([
                ["PoR Root", porBundle.por_root],
                ["Evidence Root", porBundle.evidence_root],
                ["Reasoning Root", porBundle.reasoning_root],
                ["Verdict Hash", porBundle.verdict_hash],
                ["Prompt Spec Hash", porBundle.prompt_spec_hash],
              ] as [string, string | undefined][]).map(([label, value]) => value ? (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-muted-foreground w-32 shrink-0">{label}</span>
                  <code className="font-mono text-[11px] text-muted-foreground/80 truncate">{value}</code>
                </div>
              ) : null)}
              {porBundle.created_at && (
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-32 shrink-0 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Created
                  </span>
                  <span>{formatDate(porBundle.created_at)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
