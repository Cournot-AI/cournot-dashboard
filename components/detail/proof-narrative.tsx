"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProofArtifactChip } from "@/components/shared/proof-artifact-chip";
import { OutcomeBadge, VerificationBadge } from "@/components/shared/status-badge";
import { ConfidenceBar } from "@/components/shared/confidence-bar";
import type { MarketCase, Check } from "@/lib/types";
import { cn, renderText, normalizeRules } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChevronDown,
  FileInput,
  Search,
  Scale,
  Target,
  Fingerprint,
  ShieldCheck,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Clock,
  Copy,
  Check as CheckIcon,
  Info,
} from "lucide-react";

// ─── Formatters ─────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function fmtHash(hash: string) {
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

// ─── Copyable hash with tooltip ─────────────────────────────────────────────

function HashChip({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard", {
      description: `${label} copied`,
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  }, [value, label]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 font-mono text-[11px] text-foreground/70 transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-[10px] font-sans font-medium text-muted-foreground uppercase tracking-wider shrink-0">
              {label}
            </span>
            <span className="truncate">{fmtHash(value)}</span>
            {copied ? (
              <CheckIcon className="h-3 w-3 shrink-0 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs leading-relaxed">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Check status icon ──────────────────────────────────────────────────────

const checkIcons: Record<
  Check["status"],
  { icon: typeof CheckCircle2; color: string }
> = {
  pass: { icon: CheckCircle2, color: "text-emerald-400" },
  fail: { icon: XCircle, color: "text-red-400" },
  warn: { icon: AlertTriangle, color: "text-yellow-400" },
  skip: { icon: MinusCircle, color: "text-slate-400" },
};

// ─── Narrative step wrapper (collapsible) ───────────────────────────────────

function NarrativeStep({
  stepNumber,
  icon: Icon,
  title,
  summaryLine,
  accentColor,
  defaultOpen = false,
  children,
}: {
  stepNumber: number;
  icon: typeof FileInput;
  title: string;
  summaryLine: React.ReactNode;
  accentColor: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex gap-4">
        {/* Step number + vertical connector */}
        <div className="flex flex-col items-center pt-0.5 shrink-0">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border",
              open
                ? `${accentColor} border-current/30 bg-current/10`
                : "text-muted-foreground border-border bg-muted/30"
            )}
          >
            {stepNumber}
          </div>
          <div className="w-px flex-1 bg-border min-h-[8px]" />
        </div>

        {/* Content */}
        <div className="flex-1 pb-5 min-w-0">
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-start gap-2 text-left group -mt-0.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-colors",
                      open ? accentColor : "text-muted-foreground"
                    )}
                  />
                  <h3
                    className={cn(
                      "text-[13px] font-semibold tracking-tight transition-colors",
                      open ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {title}
                  </h3>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                      open && "rotate-180"
                    )}
                  />
                </div>
                {/* Summary line — always visible */}
                <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {summaryLine}
                </div>
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
            {children}
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function ProofNarrative({ c }: { c: MarketCase }) {
  // Export handler — must be declared before any early return (Rules of Hooks)
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

  const oracle = c.oracle_result;
  if (!oracle) return null;

  const spec = c.parse_result.prompt_spec;
  const plan = c.parse_result.tool_plan;
  const checks = oracle.checks ?? [];
  const passingChecks = checks.filter((ch) => ch.status === "pass").length;
  const failingChecks = checks.filter((ch) => ch.status === "fail").length;

  // Derive which sources contributed (from checks)
  const reqChecks = checks.filter((ch) => ch.requirement_id);

  return (
    <Card className="border-border/50 overflow-hidden">
      {/* Top accent: indigo-violet narrative gradient */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

      <CardContent className="pt-5 pb-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Proof Narrative
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Human-readable audit trail from question to cryptographic proof
            </p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs font-medium text-primary hover:bg-primary/10 hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Download className="h-3.5 w-3.5" />
            Export proof bundle
          </button>
        </div>

        {/* ─── Step 1: Inputs ──────────────────────────────────────────────── */}
        <NarrativeStep
          stepNumber={1}
          icon={FileInput}
          title="Inputs"
          accentColor="text-violet-400"
          defaultOpen={true}
          summaryLine={
            <span>
              Market question canonicalized into deterministic PromptSpec
              {spec && (
                <>
                  {" — "}
                  <span className="font-mono text-foreground/60">
                    {spec.market.timezone}
                  </span>
                  {" window"}
                </>
              )}
            </span>
          }
        >
          <div className="rounded-xl border border-border bg-muted/15 p-4 space-y-3">
            {/* Question */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Market Question
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {c.source.question}
              </p>
            </div>

            {/* Event definition */}
            {spec && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Event Definition
                </p>
                <div className="rounded-lg bg-muted/30 border border-border/50 p-2.5 font-mono text-[11px] text-foreground/70 leading-relaxed">
                  {renderText(spec.market.event_definition)}
                </div>
              </div>
            )}

            {/* Resolution window + hash row */}
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Resolution Window
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono">
                    {fmtDate(c.source.resolution_window.start)}
                  </span>
                  <span className="text-muted-foreground/40">&rarr;</span>
                  <span className="font-mono">
                    {fmtDate(c.source.resolution_window.end)}
                  </span>
                </div>
              </div>
              <HashChip
                label="spec hash"
                value={oracle.prompt_spec_hash}
                tooltip="SHA-256 hash of the deterministic PromptSpec JSON (RFC 8785 canonicalized). Proves the oracle used this exact input specification."
              />
            </div>
          </div>
        </NarrativeStep>

        {/* ─── Step 2: Evidence ────────────────────────────────────────────── */}
        <NarrativeStep
          stepNumber={2}
          icon={Search}
          title="Evidence Collection"
          accentColor="text-blue-400"
          summaryLine={
            <span>
              {plan ? (
                plan.sources.length > 0 ? (
                  <>
                    Queried <span className="font-mono text-foreground/60">{plan.sources.length}</span> sources
                    {" using "}
                    <span className="font-mono text-foreground/60">
                      {spec?.data_requirements[0]?.selection_policy.strategy ?? "quorum"}
                    </span>
                    {" strategy"}
                  </>
                ) : (
                  <>
                    Sources discovered at resolve time using{" "}
                    <span className="font-mono text-foreground/60">
                      {spec?.data_requirements[0]?.selection_policy.strategy ?? "quorum"}
                    </span>
                    {" strategy"}
                  </>
                )
              ) : (
                "No tool plan — evidence collection details unavailable"
              )}
            </span>
          }
        >
          {plan && spec ? (
            <div className="space-y-3">
              {/* Source cards */}
              {plan.sources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {plan.sources.map((source) => {
                  // Find check referencing this source's requirement
                  const relatedCheck = reqChecks.find(
                    (ch) =>
                      plan.requirements.includes(ch.requirement_id!) &&
                      ch.message
                        .toLowerCase()
                        .includes(source.provider.toLowerCase())
                  );
                  const contributed = relatedCheck?.status === "pass";

                  return (
                    <div
                      key={source.source_id}
                      className={cn(
                        "rounded-lg border p-3 space-y-1.5 transition-colors",
                        contributed
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-border bg-muted/15"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold font-mono capitalize">
                          {source.provider}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono"
                          >
                            Tier {source.tier}
                          </Badge>
                          {contributed && (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {source.endpoint}
                      </p>
                    </div>
                  );
                })}
              </div>
              ) : (
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5">
                <p className="text-[11px] text-sky-400">
                  Deferred source discovery — sources were found at resolve time
                </p>
              </div>
              )}

              {/* Selection policy */}
              {spec.data_requirements.map((req) => (
                <div
                  key={req.requirement_id}
                  className="flex items-center gap-3 rounded-lg bg-muted/20 border border-border/50 px-3 py-2 text-xs"
                >
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono shrink-0"
                  >
                    {req.requirement_id}
                  </Badge>
                  <span className="text-muted-foreground">{req.description}</span>
                  <span className="ml-auto text-muted-foreground shrink-0">
                    Strategy:{" "}
                    <span className="font-mono text-foreground/70 capitalize">
                      {req.selection_policy.strategy}
                    </span>
                    {" / Quorum: "}
                    <span className="font-mono text-foreground/70">
                      {req.selection_policy.quorum}
                    </span>
                  </span>
                </div>
              ))}

              {/* Timestamp */}
              <p className="text-[10px] text-muted-foreground">
                Evidence collected at{" "}
                <span className="font-mono text-foreground/60">
                  {fmtDate(oracle.executed_at)}
                </span>
                {" in "}
                <span className="font-mono text-foreground/60">
                  {oracle.duration_ms}ms
                </span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">
              Tool plan not available for this case.
            </p>
          )}
        </NarrativeStep>

        {/* ─── Step 3: Rule Application ───────────────────────────────────── */}
        <NarrativeStep
          stepNumber={3}
          icon={Scale}
          title="Rule Application"
          accentColor="text-amber-400"
          summaryLine={
            <span>
              {spec ? (
                <>
                  Applied{" "}
                  <span className="font-mono text-foreground/60">
                    {normalizeRules(spec.market.resolution_rules).length}
                  </span>
                  {" resolution rules in priority order"}
                </>
              ) : (
                "No resolution rules available"
              )}
            </span>
          }
        >
          {spec ? (
            <div className="space-y-2">
              {normalizeRules(spec.market.resolution_rules)
                .sort((a, b) => a.priority - b.priority)
                .map((rule) => {
                  // Find any check that might relate to this rule
                  const relatedCheck = checks.find(
                    (ch) =>
                      ch.name
                        .toLowerCase()
                        .includes(
                          rule.description.split(" ")[0].toLowerCase()
                        ) ||
                      ch.message
                        .toLowerCase()
                        .includes(
                          rule.description.split(" ")[0].toLowerCase()
                        )
                  );

                  return (
                    <div
                      key={rule.rule_id}
                      className="rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono shrink-0"
                        >
                          {rule.rule_id}
                        </Badge>
                        <span className="text-xs font-medium flex-1">
                          {rule.description}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] text-muted-foreground shrink-0"
                        >
                          Priority {rule.priority}
                        </Badge>
                      </div>
                      {relatedCheck && (
                        <div className="flex items-center gap-2 mt-1.5 pl-0.5">
                          {(() => {
                            const cfg = checkIcons[relatedCheck.status];
                            const Icon = cfg.icon;
                            return (
                              <Icon
                                className={cn("h-3 w-3 shrink-0", cfg.color)}
                              />
                            );
                          })()}
                          <span className="text-[11px] text-muted-foreground">
                            {relatedCheck.message}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">
              PromptSpec unavailable — rules could not be applied.
            </p>
          )}
        </NarrativeStep>

        {/* ─── Step 4: Output ─────────────────────────────────────────────── */}
        <NarrativeStep
          stepNumber={4}
          icon={Target}
          title="Output"
          accentColor="text-emerald-400"
          summaryLine={
            <span className="flex items-center gap-2">
              Verdict:{" "}
              <OutcomeBadge outcome={oracle.outcome} />
              <span className="text-muted-foreground/40">|</span>
              <span className="font-mono text-foreground/60">
                {Math.round(oracle.confidence * 100)}% confidence
              </span>
            </span>
          }
        >
          <div className="rounded-xl border border-border bg-muted/15 p-4 space-y-4">
            {/* Outcome + confidence */}
            <div className="flex flex-wrap items-center gap-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Verdict
                </p>
                <OutcomeBadge outcome={oracle.outcome} size="lg" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Confidence
                </p>
                <ConfidenceBar
                  confidence={oracle.confidence}
                  size="lg"
                  showLabel
                />
              </div>
            </div>

            {/* Output schema + determinism */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
              {spec && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5">
                        <Info className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">
                          Output schema:{" "}
                          <span className="font-mono text-foreground/70">
                            {spec.output_schema_ref}
                          </span>
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">
                        Deterministic output schema that constrains the oracle response format. The result is guaranteed to conform to this schema version.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Badge
                variant="outline"
                className="text-[10px] font-mono capitalize"
              >
                {oracle.execution_mode}
              </Badge>
            </div>
          </div>
        </NarrativeStep>

        {/* ─── Step 5: Proof Anchors ──────────────────────────────────────── */}
        <NarrativeStep
          stepNumber={5}
          icon={Fingerprint}
          title="Proof Anchors"
          accentColor="text-purple-400"
          summaryLine="Cryptographic Merkle roots anchoring evidence, reasoning, and proof-of-resolution"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
        </NarrativeStep>

        {/* ─── Step 6: Verification ───────────────────────────────────────── */}
        <NarrativeStep
          stepNumber={6}
          icon={ShieldCheck}
          title="Verification"
          accentColor={oracle.verification_ok ? "text-emerald-400" : "text-red-400"}
          summaryLine={
            <span className="flex items-center gap-2">
              <VerificationBadge ok={oracle.verification_ok} />
              <span className="text-muted-foreground/40">|</span>
              <span className="font-mono text-foreground/60">
                {passingChecks}/{checks.length} checks passed
              </span>
              {failingChecks > 0 && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="font-mono text-red-400/80">
                    {failingChecks} failed
                  </span>
                </>
              )}
            </span>
          }
        >
          <div className="space-y-2">
            {checks.map((check) => {
              const cfg = checkIcons[check.status];
              const Icon = cfg.icon;

              return (
                <div
                  key={check.check_id}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 flex items-start gap-2.5",
                    check.status === "fail"
                      ? "border-red-500/20 bg-red-500/5"
                      : check.status === "warn"
                      ? "border-yellow-500/15 bg-yellow-500/5"
                      : "border-border/50 bg-muted/10"
                  )}
                >
                  <Icon
                    className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", cfg.color)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{check.name}</span>
                      {check.requirement_id && (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono"
                        >
                          {check.requirement_id}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {check.message}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] capitalize shrink-0",
                      cfg.color,
                      "border-current/20"
                    )}
                  >
                    {check.status}
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Verification conclusion */}
          <div
            className={cn(
              "rounded-lg border px-4 py-3 flex items-center gap-3 mt-1",
              oracle.verification_ok
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
            )}
          >
            {oracle.verification_ok ? (
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
            )}
            <div>
              <p
                className={cn(
                  "text-xs font-semibold",
                  oracle.verification_ok ? "text-emerald-400" : "text-red-400"
                )}
              >
                {oracle.verification_ok
                  ? "All proofs verified — resolution is cryptographically sound"
                  : "Verification failed — one or more integrity checks did not pass"}
              </p>
            </div>
          </div>
        </NarrativeStep>

        {/* ─── Footer: Export CTA ─────────────────────────────────────────── */}
        <Separator className="my-1" />
        <div className="flex items-center justify-between pt-2">
          <p className="text-[10px] text-muted-foreground">
            This narrative was generated from on-chain artifacts. Hashes are
            independently verifiable.
          </p>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Download className="h-3 w-3" />
            Download JSON bundle
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
