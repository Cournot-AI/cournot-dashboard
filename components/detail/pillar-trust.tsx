"use client";

import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProofArtifactChip } from "@/components/shared/proof-artifact-chip";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorCallout } from "@/components/shared/error-callout";
import type { MarketCase } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, FileCheck, Info, Download, Brain, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PillarTrust({ c }: { c: MarketCase }) {
  const oracle = c.oracle_result;

  const handleExport = useCallback(() => {
    const bundle = {
      market_id: c.market_id,
      exported_at: new Date().toISOString(),
      source: c.source,
      parse_result: c.parse_result,
      oracle_result: c.oracle_result,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proof-bundle-${c.market_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Proof bundle exported", {
      description: `${c.market_id}.json downloaded`,
      duration: 3000,
    });
  }, [c]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          Trust & Proof
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Cryptographic anchors and verification status
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {oracle ? (
          <>
            {/* Verification status */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Verification Status
              </p>
              <div
                className={cn(
                  "rounded-lg border px-4 py-3 flex items-center gap-3",
                  oracle.verification_ok
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-red-500/20 bg-red-500/5"
                )}
              >
                {oracle.verification_ok ? (
                  <FileCheck className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Shield className="h-5 w-5 text-red-400" />
                )}
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      oracle.verification_ok ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {oracle.verification_ok ? "Verification Passed" : "Verification Failed"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {oracle.verification_ok
                      ? "All cryptographic proofs are valid and consistent"
                      : "One or more integrity checks failed — data may have been tampered with"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* ─── Deterministic Audit Anchors (ProofArtifactChip layout) ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Deterministic Audit Anchors
                </p>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/10 hover:border-primary/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Download className="h-3 w-3" />
                  Download proof bundle
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                These anchors allow anyone to verify the oracle run deterministically.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <ProofArtifactChip
                  label="Prompt Spec Hash"
                  value={oracle.prompt_spec_hash}
                  tooltip="SHA-256 of the canonical PromptSpec JSON. When created_at is null it is excluded from serialization, guaranteeing identical specs produce identical hashes."
                />
                <ProofArtifactChip
                  label="Evidence Root"
                  value={oracle.evidence_root}
                  tooltip="Merkle root committing to every piece of collected evidence. Proves exactly which data was used to reach the verdict."
                />
                <ProofArtifactChip
                  label="Reasoning Root"
                  value={oracle.reasoning_root}
                  tooltip="Merkle root committing to the full reasoning trace. Proves the logical chain from evidence to conclusion."
                />
                <ProofArtifactChip
                  label="PoR Root"
                  value={oracle.por_root}
                  tooltip="Proof-of-Resolution root. Top-level Merkle root combining evidence, reasoning, and output into a single tamper-evident commitment."
                />
              </div>
            </div>

            <Separator />

            {/* Execution context */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Execution Context
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Mode:</span>{" "}
                  <Badge variant="outline" className="text-[10px] font-mono capitalize">
                    {oracle.execution_mode}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Compiler:</span>{" "}
                  <span className="font-mono">{c.parse_result.metadata.compiler}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Strict:</span>{" "}
                  <span
                    className={
                      c.parse_result.metadata.strict_mode ? "text-blue-400" : "text-slate-400"
                    }
                  >
                    {String(c.parse_result.metadata.strict_mode)}
                  </span>
                </div>
              </div>
            </div>

            {/* LLM Review */}
            {oracle.llm_review && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-3.5 w-3.5 text-violet-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      LLM Review
                    </p>
                  </div>

                  {/* Reasoning validity */}
                  <div
                    className={cn(
                      "rounded-lg border px-3 py-2.5 flex items-center gap-2.5",
                      oracle.llm_review.reasoning_valid
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-red-500/20 bg-red-500/5"
                    )}
                  >
                    {oracle.llm_review.reasoning_valid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    )}
                    <div>
                      <p
                        className={cn(
                          "text-xs font-medium",
                          oracle.llm_review.reasoning_valid
                            ? "text-emerald-400"
                            : "text-red-400"
                        )}
                      >
                        {oracle.llm_review.reasoning_valid
                          ? "Reasoning validated by LLM review"
                          : "LLM review flagged reasoning issues"}
                      </p>
                    </div>
                  </div>

                  {/* Issues */}
                  {oracle.llm_review.issues?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Issues found:</p>
                      {oracle.llm_review.issues.map((issue, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2"
                        >
                          <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-red-400">{issue}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Confidence adjustments from review */}
                  {oracle.llm_review.confidence_adjustments.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">
                        Confidence adjustments from review:
                      </p>
                      {oracle.llm_review.confidence_adjustments.map((adj, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg bg-muted/20 border border-border/50 px-3 py-1.5 text-xs"
                        >
                          <span className="text-muted-foreground">{adj.reason}</span>
                          <span
                            className={cn(
                              "font-mono font-medium",
                              adj.delta > 0
                                ? "text-emerald-400"
                                : adj.delta < 0
                                ? "text-red-400"
                                : "text-muted-foreground"
                            )}
                          >
                            {adj.delta > 0 ? "+" : ""}
                            {Math.round(adj.delta * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Final justification */}
                  <div className="rounded-lg bg-muted/30 border border-border/50 p-3">
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {oracle.llm_review.final_justification}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Canonical serialization note */}
            <div className="flex items-start gap-2 rounded-lg bg-muted/20 border border-border/50 px-3 py-2.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                PromptSpec is serialized using deterministic JSON canonicalization (RFC 8785).
                The byte sequence is hashed with SHA-256 to produce{" "}
                <code className="font-mono text-foreground/70">prompt_spec_hash</code>.
              </p>
            </div>

            {/* Errors */}
            {(oracle.errors ?? []).length > 0 && (
              <>
                <Separator />
                <ErrorCallout errors={oracle.errors} />
              </>
            )}
          </>
        ) : (
          <EmptyState type="pending" />
        )}
      </CardContent>
    </Card>
  );
}
