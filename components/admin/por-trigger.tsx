"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { useRole } from "@/lib/role";
import { callApi, InvalidCodeError, buildRunSummary } from "@/lib/oracle-api";
import type { RunSummary, TemporalConstraint, QualityScorecard } from "@/lib/types";
import type { ResolutionArtifacts, DisputeResponse } from "@/components/playground/dispute-panel";
import { DisputePanel } from "@/components/playground/dispute-panel";
import { LLMDisputePanel } from "@/components/playground/llm-dispute-panel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Sparkles, CheckCircle, Circle, Settings, Minus, Plus,
} from "lucide-react";
import { toast } from "sonner";

// ─── Pipeline types ──────────────────────────────────────────────────────────

type StepId = "collect" | "quality_check" | "audit" | "judge" | "bundle";
type StepStatus = "pending" | "running" | "completed" | "error";

interface PipelineStep {
  id: StepId;
  label: string;
  status: StepStatus;
  detail?: string;
}

function createSteps(): PipelineStep[] {
  return [
    { id: "collect", label: "Collect Evidence", status: "pending" },
    { id: "quality_check", label: "Quality Check", status: "pending" },
    { id: "audit", label: "Audit & Reasoning", status: "pending" },
    { id: "judge", label: "Judge Verdict", status: "pending" },
    { id: "bundle", label: "Bundle Proof", status: "pending" },
  ];
}

function StepIndicator({ step }: { step: PipelineStep }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {step.status === "running" ? (
        <Loader2 className="h-3 w-3 animate-spin text-primary" />
      ) : step.status === "completed" ? (
        <CheckCircle className="h-3 w-3 text-green-400" />
      ) : step.status === "error" ? (
        <Circle className="h-3 w-3 text-red-400" />
      ) : (
        <Circle className="h-3 w-3 text-muted-foreground/30" />
      )}
      <span className={step.status === "running" ? "text-primary font-medium" : step.status === "completed" ? "text-green-400" : step.status === "error" ? "text-red-400" : "text-muted-foreground/50"}>
        {step.label}
      </span>
      {step.detail && (
        <span className="text-muted-foreground/70 truncate max-w-[300px]">{step.detail}</span>
      )}
    </div>
  );
}

// ─── Capabilities types ──────────────────────────────────────────────────────

interface ProviderInfo {
  provider: string;
  default_model: string;
}

interface CollectorAgent {
  name: string;
  description?: string;
  is_fallback?: boolean;
}

interface CollectorStep {
  step: string;
  agents: CollectorAgent[];
}

interface CollectorInfo {
  id: string;
  name: string;
  description: string;
}

// ─── Collector descriptions ──────────────────────────────────────────────────

const COLLECTOR_DESCRIPTIONS: Record<string, string> = {
  CollectorOpenSearch: "Searches the web for relevant articles and news using open search queries. Good general-purpose collector.",
  CollectorSitePinned: "Fetches content from specific URLs referenced in the market description. Best for markets that cite official sources.",
  CollectorHyDE: "Hypothetical Document Embeddings — generates a hypothetical answer document and searches for similar real content. Useful for nuanced or complex queries.",
  CollectorWebPageReader: "Reads and extracts content from specific web pages. Works best when the market references known URLs.",
  CollectorHTTP: "Direct HTTP requests to API endpoints or data sources. For structured/machine-readable data.",
  CollectorMock: "Test collector that returns synthetic data. For development and testing only.",
};

// ─── Raw result shape ────────────────────────────────────────────────────────

interface PorRawResult {
  ok: boolean;
  errors: string[];
  outcome: string;
  confidence: number;
  por_root: string;
  market_id: string;
  artifacts: {
    verdict: any;
    por_bundle: any;
    reasoning_trace: any;
    evidence_bundles: any[];
    collectors_used: string[];
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

interface PorTriggerProps {
  question: string;
  aiPrompt?: string;
  aiResult?: string;
  onResult: (summary: RunSummary) => void;
  onRawResult?: (raw: string) => void;
  /** Called when the pipeline obtains/generates an ai_prompt (prompt_spec + tool_plan) */
  onAiPrompt?: (prompt: string) => void;
  /** Content rendered inside the "Resolve" tab */
  resolveContent?: ReactNode;
}

export function PorTrigger({ question, aiPrompt, aiResult, onResult, onRawResult, onAiPrompt, resolveContent }: PorTriggerProps) {
  const { accessCode } = useRole();
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>(createSteps());
  const [done, setDone] = useState(false);
  const [skipQualityCheck, setSkipQualityCheck] = useState(false);

  // ── Capabilities state ──
  const [availableCollectors, setAvailableCollectors] = useState<CollectorInfo[]>([]);
  const [collectorCounts, setCollectorCounts] = useState<Record<string, number>>({});
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("");

  // ── Resolution artifacts for dispute ──
  const [resolutionArtifacts, setResolutionArtifacts] = useState<ResolutionArtifacts | null>(null);

  // ── Parse existing ai_result into initial ResolutionArtifacts ──
  const initialArtifacts = useMemo<ResolutionArtifacts | null>(() => {
    if (!aiResult) return null;
    try {
      const parsed = JSON.parse(aiResult);
      const arts = parsed.artifacts ?? parsed;
      if (!arts.verdict && !parsed.outcome) return null;

      let promptSpec: any = null;
      let toolPlan: any = null;
      if (aiPrompt) {
        try {
          const p = JSON.parse(aiPrompt);
          promptSpec = p.prompt_spec ?? p;
          toolPlan = p.tool_plan ?? null;
        } catch { /* ignore */ }
      }

      return {
        prompt_spec: arts.prompt_spec ?? promptSpec,
        tool_plan: toolPlan,
        collectors_used: arts.collectors_used ?? [],
        evidence_bundles: arts.evidence_bundles ?? [],
        reasoning_trace: arts.reasoning_trace ?? null,
        verdict: arts.verdict ?? { outcome: parsed.outcome, confidence: parsed.confidence },
        por_bundle: arts.por_bundle ?? null,
        quality_scorecard: arts.quality_scorecard ?? null,
        temporal_constraint: arts.temporal_constraint ?? null,
      };
    } catch {
      return null;
    }
  }, [aiResult, aiPrompt]);

  useEffect(() => {
    if (initialArtifacts && !resolutionArtifacts && !done) {
      setResolutionArtifacts(initialArtifacts);
    }
  }, [initialArtifacts, resolutionArtifacts, done]);

  // Derive selectedCollectors from counts
  const selectedCollectors = Object.entries(collectorCounts).flatMap(([id, count]) =>
    Array(count).fill(id)
  );

  // ── Fetch capabilities on mount ──
  const handleInvalidCode = useCallback(() => {
    toast.error("Invalid access code");
  }, []);

  useEffect(() => {
    if (!accessCode) return;

    callApi(accessCode, "/capabilities", {}, "GET")
      .then((data) => {
        if (Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
        if (Array.isArray(data.steps)) {
          const collectorStep = data.steps.find(
            (s: CollectorStep) => s.step === "collector"
          ) as CollectorStep | undefined;
          if (collectorStep && Array.isArray(collectorStep.agents)) {
            const collectors: CollectorInfo[] = collectorStep.agents.map((a: CollectorAgent) => ({
              id: a.name,
              name: (a.name as string).replace(/^Collector/, ""),
              description: a.description ?? "",
            }));
            setAvailableCollectors(collectors);
            // Default: enable the 4 main collectors (matching playground defaults)
            const defaultIds = ["CollectorOpenSearch", "CollectorSitePinned", "CollectorHyDE"];
            const defaults: Record<string, number> = {};
            for (const id of defaultIds) {
              if (collectors.some((c) => c.id === id)) {
                defaults[id] = 1;
              }
            }
            if (Object.keys(defaults).length > 0) {
              setCollectorCounts(defaults);
            } else {
              // Fallback: enable first non-fallback collector
              const fallback = collectorStep.agents.find((a: CollectorAgent) => !a.is_fallback);
              if (fallback) setCollectorCounts({ [fallback.name]: 1 });
              else if (collectors.length > 0) setCollectorCounts({ [collectors[0].id]: 1 });
            }
          }
        }
      })
      .catch((err) => {
        if (err instanceof InvalidCodeError) {
          handleInvalidCode();
        } else {
          console.warn("Failed to fetch capabilities:", err);
        }
      });
  }, [accessCode, handleInvalidCode]);

  // ── Collector helpers ──
  function toggleCollector(collectorId: string) {
    setCollectorCounts((prev) => {
      const next = { ...prev };
      if (next[collectorId] > 0) {
        const totalEnabled = Object.values(next).reduce((s, c) => s + c, 0);
        if (totalEnabled <= next[collectorId]) return prev;
        delete next[collectorId];
      } else {
        next[collectorId] = 1;
      }
      return next;
    });
  }

  function setCollectorCount(collectorId: string, count: number) {
    setCollectorCounts((prev) => {
      const next = { ...prev };
      if (count <= 0) {
        const totalEnabled = Object.values(next).reduce((s, c) => s + c, 0);
        if (totalEnabled <= (next[collectorId] ?? 0)) return prev;
        delete next[collectorId];
      } else {
        next[collectorId] = Math.min(count, 5);
      }
      return next;
    });
  }

  // ── Step updater ──
  function updateStep(id: StepId, status: StepStatus, detail?: string) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, detail } : s))
    );
  }

  // ── Build raw result JSON ──
  function buildRawResultJson(
    outcome: string, confidence: number, porRoot: string,
    verdict: any, porBundle: any, reasoningTrace: any,
    evidenceBundles: any[], collectorsUsed: string[],
  ): string {
    const rawResult: PorRawResult = {
      ok: true, errors: [], outcome, confidence, por_root: porRoot,
      market_id: verdict?.market_id ?? "",
      artifacts: { verdict, por_bundle: porBundle, reasoning_trace: reasoningTrace, evidence_bundles: evidenceBundles, collectors_used: collectorsUsed },
    };
    return JSON.stringify(rawResult);
  }

  // ── Run full pipeline ──
  async function handleRun() {
    if (!accessCode) return;
    setLoading(true);
    setDone(false);
    setSteps(createSteps());
    setResolutionArtifacts(null);

    try {
      let promptSpec: any = null;
      let toolPlan: any = null;
      if (aiPrompt) {
        try {
          const parsed = JSON.parse(aiPrompt);
          promptSpec = parsed.prompt_spec ?? null;
          toolPlan = parsed.tool_plan ?? null;
        } catch { /* ignore */ }
      }

      if (!promptSpec) {
        const validateData = await callApi(accessCode, "/validate", {
          user_input: question,
          ...(selectedProvider && { llm_provider: selectedProvider }),
          ...(selectedProvider && selectedModel && { llm_model: selectedModel }),
        });
        promptSpec = validateData.prompt_spec;
        toolPlan = validateData.tool_plan;
      }

      if (!promptSpec || !toolPlan) throw new Error("Could not obtain prompt_spec and tool_plan");

      // Notify parent of the generated ai_prompt so ResolveForm can derive possible_outcomes
      onAiPrompt?.(JSON.stringify({ prompt_spec: promptSpec, tool_plan: toolPlan }));

      const temporalConstraint: TemporalConstraint | null =
        (promptSpec?.extra?.temporal_constraint as TemporalConstraint) ?? null;

      const collectorsToUse = selectedCollectors.length > 0 ? selectedCollectors : ["CollectorOpenSearch"];

      // Collect
      updateStep("collect", "running");
      const collectData = await callApi(accessCode, "/step/collect", {
        prompt_spec: promptSpec, tool_plan: toolPlan, collectors: collectorsToUse,
        ...(selectedProvider && { llm_provider: selectedProvider }),
        ...(selectedProvider && selectedModel && { llm_model: selectedModel }),
      });
      if (collectData.ok === false) throw new Error(collectData.errors?.join("; ") || "Collect failed");
      let evidenceBundles = collectData.evidence_bundles ?? [];
      const totalEvidence = evidenceBundles.reduce((sum: number, b: any) => sum + (b?.items?.length ?? 0), 0);
      updateStep("collect", "completed", `${totalEvidence} evidence items`);

      // Quality check
      let qualityScorecard: QualityScorecard | null = null;
      if (skipQualityCheck) {
        updateStep("quality_check", "completed", "Skipped");
      } else {
        updateStep("quality_check", "running");
        const MAX_QC_RETRIES = 2;
        for (let i = 0; i < MAX_QC_RETRIES; i++) {
          const qcData = await callApi(accessCode, "/step/quality_check", { prompt_spec: promptSpec, evidence_bundles: evidenceBundles });
          if (!qcData.ok) break;
          qualityScorecard = qcData.scorecard;
          if (qcData.meets_threshold) break;
          const retryHints = qualityScorecard?.retry_hints;
          if (!retryHints || Object.keys(retryHints).length === 0) break;
          const retryData = await callApi(accessCode, "/step/collect", {
            prompt_spec: promptSpec, tool_plan: toolPlan, collectors: collectorsToUse, quality_feedback: retryHints,
            ...(selectedProvider && { llm_provider: selectedProvider }),
            ...(selectedProvider && selectedModel && { llm_model: selectedModel }),
          });
          if (retryData.ok !== false && Array.isArray(retryData.evidence_bundles)) {
            evidenceBundles = [...evidenceBundles, ...retryData.evidence_bundles];
          }
        }
        const qualityLevel = qualityScorecard?.quality_level ?? "N/A";
        updateStep("quality_check", "completed", `${qualityLevel} | ${qualityScorecard?.meets_threshold ? "Passed" : "Below threshold"}`);
      }

      // Audit
      updateStep("audit", "running");
      const auditData = await callApi(accessCode, "/step/audit", {
        prompt_spec: promptSpec, evidence_bundles: evidenceBundles,
        ...(qualityScorecard && { quality_scorecard: qualityScorecard }),
        ...(temporalConstraint && { temporal_constraint: temporalConstraint }),
        ...(selectedProvider && { llm_provider: selectedProvider }),
        ...(selectedProvider && selectedModel && { llm_model: selectedModel }),
      });
      if (auditData.ok === false) throw new Error(auditData.errors?.join("; ") || "Audit failed");
      const reasoningTrace = auditData.reasoning_trace;
      updateStep("audit", "completed", `${reasoningTrace?.steps?.length ?? 0} reasoning steps`);

      // Judge
      updateStep("judge", "running");
      const judgeData = await callApi(accessCode, "/step/judge", {
        prompt_spec: promptSpec, evidence_bundles: evidenceBundles, reasoning_trace: reasoningTrace,
        ...(qualityScorecard && { quality_scorecard: qualityScorecard }),
        ...(temporalConstraint && { temporal_constraint: temporalConstraint }),
        ...(selectedProvider && { llm_provider: selectedProvider }),
        ...(selectedProvider && selectedModel && { llm_model: selectedModel }),
      });
      if (judgeData.ok === false) throw new Error(judgeData.errors?.join("; ") || "Judge failed");
      const verdict = judgeData.verdict;
      const outcome = judgeData.outcome;
      const confidence = judgeData.confidence;
      updateStep("judge", "completed", `${outcome ?? "UNKNOWN"} at ${confidence != null ? Math.round(confidence * 100) : "?"}%`);

      // Bundle
      updateStep("bundle", "running");
      const bundleData = await callApi(accessCode, "/step/bundle", {
        prompt_spec: promptSpec, evidence_bundles: evidenceBundles, reasoning_trace: reasoningTrace, verdict,
      });
      if (bundleData.ok === false) throw new Error(bundleData.errors?.join("; ") || "Bundle failed");
      const porBundle = bundleData.por_bundle;
      const porRoot = bundleData.por_root;
      updateStep("bundle", "completed", `root: ${typeof porRoot === "string" ? porRoot.slice(0, 10) + "\u2026" : "N/A"}`);

      const summary = buildRunSummary(evidenceBundles, reasoningTrace, verdict, porBundle, outcome, confidence, porRoot);
      onResult(summary);
      onRawResult?.(buildRawResultJson(outcome, confidence, porRoot, verdict, porBundle, reasoningTrace, evidenceBundles, collectorsToUse));

      setResolutionArtifacts({
        prompt_spec: promptSpec, tool_plan: toolPlan, collectors_used: collectorsToUse,
        evidence_bundles: evidenceBundles, reasoning_trace: reasoningTrace, verdict,
        por_bundle: porBundle, quality_scorecard: qualityScorecard, temporal_constraint: temporalConstraint,
      });

      setDone(true);
      toast.success("PoR pipeline complete", {
        description: `Outcome: ${outcome} (${Math.round(confidence * 100)}% confidence). Results applied to the Resolve tab.`,
      });
    } catch (err) {
      toast.error("PoR failed", { description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  // ── Dispute handlers ──
  async function handleDisputeSubmit(payload: any): Promise<DisputeResponse> {
    if (!accessCode) throw new Error("Missing access code");
    return callApi(accessCode, "/dispute", payload, "POST");
  }

  async function handleLLMDisputeSubmit(payload: any): Promise<DisputeResponse> {
    if (!accessCode) throw new Error("Missing access code");
    return callApi(accessCode, "/dispute/llm", payload, "POST");
  }

  function handleDisputeResult(response: DisputeResponse) {
    if (!response.artifacts) return;
    const a = response.artifacts;
    const collectorsUsed = selectedCollectors.length > 0 ? selectedCollectors : resolutionArtifacts?.collectors_used ?? [];

    // Prefer evidence_bundles (plural array) over evidence_bundle (singular)
    const newEvidenceBundles = (a.evidence_bundles && a.evidence_bundles.length > 0)
      ? a.evidence_bundles
      : a.evidence_bundle
        ? [a.evidence_bundle]
        : resolutionArtifacts?.evidence_bundles ?? [];

    const newRaw: PorRawResult = {
      ok: true, errors: [],
      outcome: a.verdict?.outcome ?? resolutionArtifacts?.verdict?.outcome ?? "UNKNOWN",
      confidence: a.verdict?.confidence ?? a.verdict?.metadata?.confidence ?? resolutionArtifacts?.verdict?.confidence ?? 0,
      por_root: resolutionArtifacts?.por_bundle?.por_root ?? "",
      market_id: a.verdict?.market_id ?? "",
      artifacts: {
        verdict: a.verdict ?? resolutionArtifacts?.verdict,
        por_bundle: resolutionArtifacts?.por_bundle,
        reasoning_trace: a.reasoning_trace ?? resolutionArtifacts?.reasoning_trace,
        evidence_bundles: newEvidenceBundles,
        collectors_used: collectorsUsed,
      },
    };
    onRawResult?.(JSON.stringify(newRaw));

    setResolutionArtifacts((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        verdict: a.verdict ?? prev.verdict,
        reasoning_trace: a.reasoning_trace ?? prev.reasoning_trace,
        evidence_bundles: newEvidenceBundles,
        collectors_used: collectorsUsed,
      };
    });
  }

  // Whether dispute tab has content
  const hasDisputeArtifacts = resolutionArtifacts !== null;

  // ─── Settings panel (rendered inside Rerun & Dispute tabs) ──────────────

  const settingsPanel = (
    <details open className="rounded-lg border border-border/50 bg-muted/10">
      <summary className="p-3 cursor-pointer text-xs font-medium flex items-center gap-2">
        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        Pipeline Settings
        {selectedCollectors.length > 0 && (
          <Badge variant="outline" className="text-[10px] ml-auto">
            {selectedCollectors.length} collector{selectedCollectors.length !== 1 ? "s" : ""}
            {selectedProvider ? ` | ${selectedProvider}` : ""}
          </Badge>
        )}
      </summary>
      <div className="px-3 pb-3 space-y-4 border-t border-border/30 pt-3">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Collectors</label>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
            Select which data collectors to use for gathering evidence. Each collector uses a different strategy.
            Increase the count to run multiple passes with the same collector.
          </p>
          {availableCollectors.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 italic">Loading collectors...</p>
          ) : (
            <div className="space-y-1.5">
              {availableCollectors.map((c) => {
                const count = collectorCounts[c.id] ?? 0;
                const isActive = count > 0;
                const desc = COLLECTOR_DESCRIPTIONS[c.id] || c.description || "";
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleCollector(c.id)} disabled={loading}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors shrink-0 ${
                        isActive ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/30"
                      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      title={desc}>
                      {c.name}
                    </button>
                    {isActive && (
                      <div className="inline-flex items-center gap-0.5 shrink-0">
                        <button type="button" onClick={() => setCollectorCount(c.id, count - 1)} disabled={loading}
                          className="h-5 w-5 rounded border border-border/50 inline-flex items-center justify-center text-muted-foreground hover:bg-muted/30 disabled:opacity-50">
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="text-xs font-mono w-4 text-center">{count}</span>
                        <button type="button" onClick={() => setCollectorCount(c.id, count + 1)} disabled={loading || count >= 5}
                          className="h-5 w-5 rounded border border-border/50 inline-flex items-center justify-center text-muted-foreground hover:bg-muted/30 disabled:opacity-50">
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                    {desc && (
                      <span className="text-[10px] text-muted-foreground/60 leading-tight truncate">{desc}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Provider</label>
            <Select value={selectedProvider ?? "__default__"}
              onValueChange={(v) => {
                if (v === "__default__") { setSelectedProvider(null); setSelectedModel(""); }
                else { setSelectedProvider(v); const p = providers.find((p) => p.provider === v); if (p) setSelectedModel(p.default_model); }
              }}
              disabled={loading}>
              <SelectTrigger className="text-xs"><SelectValue placeholder="Server default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">Server default</SelectItem>
                {providers.map((p) => (<SelectItem key={p.provider} value={p.provider}>{p.provider}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Model</label>
            <Input value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
              disabled={loading || !selectedProvider}
              placeholder={selectedProvider ? "model name" : "select provider first"}
              className="text-xs" />
          </div>
        </div>
      </div>
    </details>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Tabs defaultValue="resolve">
      <TabsList>
        <TabsTrigger value="resolve">Resolve</TabsTrigger>
        <TabsTrigger value="rerun">Rerun</TabsTrigger>
        <TabsTrigger value="dispute" disabled={!hasDisputeArtifacts}>Dispute</TabsTrigger>
      </TabsList>

      {/* ── Resolve tab ── */}
      <TabsContent value="resolve" className="mt-4 space-y-3">
        <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Review the AI result above, then set the final outcome below. The form merges your decision
            into the full PoR artifacts and submits it as the market resolution.
            Use <strong>Advanced Edit</strong> to inspect or override individual fields in the JSON.
            You can also <strong>Rerun</strong> the pipeline or <strong>Dispute</strong> the verdict
            before resolving.
          </p>
        </div>
        {resolveContent ?? (
          <p className="text-xs text-muted-foreground italic">
            Run Proof of Reasoning first to enable resolution.
          </p>
        )}
      </TabsContent>

      {/* ── Rerun tab ── */}
      <TabsContent value="rerun" className="mt-4 space-y-4">
        {settingsPanel}

        <div className="space-y-1">
          <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={skipQualityCheck}
              onChange={(e) => setSkipQualityCheck(e.target.checked)}
              disabled={loading}
              className="rounded border-border"
            />
            Skip quality check
          </label>
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed ml-5">
            Quality check validates that collected evidence aligns with the market definition.
            It strictly matches sources against the market requirements and may flag evidence as invalid
            if sources don&apos;t directly address the market question. This can lead to higher
            invalid/insufficient rates when sources are tangentially related. Skip this step
            if you trust the evidence or want faster iteration.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={loading}
            className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Running PoR Pipeline\u2026" : "Run Proof of Reasoning"}
          </button>
          {done && (
            <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400">Complete</Badge>
          )}
        </div>

        {(loading || done) && (
          <div className="rounded-lg border border-border/50 bg-muted/10 p-3 space-y-1.5">
            {steps.map((step) => <StepIndicator key={step.id} step={step} />)}
          </div>
        )}
        {done && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2">
            <p className="text-[11px] text-green-400 leading-relaxed">
              <CheckCircle className="h-3 w-3 inline mr-1 align-text-bottom" />
              Pipeline results have been applied to the <strong>Resolve</strong> tab.
              Switch to the Resolve tab to review and finalize the outcome, or use the
              Dispute tab to challenge the verdict.
            </p>
          </div>
        )}
      </TabsContent>

      {/* ── Dispute tab ── */}
      <TabsContent value="dispute" className="mt-4 space-y-4">
        {hasDisputeArtifacts ? (
          <>
            <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2 space-y-1.5">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Challenge the current verdict by providing a reason and explanation. The system will
                re-run the appropriate pipeline steps based on the reason code you select:
              </p>
              <ul className="text-[11px] text-muted-foreground/80 leading-relaxed ml-3 list-disc space-y-0.5">
                <li><strong>EVIDENCE_MISREAD</strong> &mdash; re-collects evidence, then re-runs audit and judge. Requires tool_plan + collectors.</li>
                <li><strong>EVIDENCE_INSUFFICIENT</strong> &mdash; collects from your provided URLs/domains, then re-runs audit and judge.</li>
                <li><strong>REASONING_ERROR / LOGIC_GAP / OTHER</strong> &mdash; re-runs audit and judge using existing evidence.</li>
              </ul>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                After disputing, the updated verdict will be applied to the Resolve tab automatically.
              </p>
            </div>

            {settingsPanel}

            <details open>
              <summary className="text-xs font-medium text-muted-foreground cursor-pointer mb-2">
                LLM Dispute (plain language)
              </summary>
              <div className="rounded-lg border border-border/20 bg-muted/5 px-3 py-2 mb-3">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Describe what went wrong in plain language. The LLM will analyze your message and
                  determine which steps to re-run. Any URLs or domains mentioned in your message will
                  be automatically extracted and merged with explicitly provided evidence URLs
                  (deduplicated). If the reason code is EVIDENCE_INSUFFICIENT and URLs are found,
                  fresh evidence collection will happen automatically.
                </p>
              </div>
              <LLMDisputePanel
                artifacts={resolutionArtifacts}
                collectors={selectedCollectors.length > 0 ? selectedCollectors : undefined}
                onSubmit={async (payload) => {
                  const res = await handleLLMDisputeSubmit(payload);
                  handleDisputeResult(res);
                  return res;
                }}
                disabled={loading}
              />
            </details>

            <details>
              <summary className="text-xs font-medium text-muted-foreground cursor-pointer mb-2">
                Advanced Dispute (technical)
              </summary>
              <div className="rounded-lg border border-border/20 bg-muted/5 px-3 py-2 mb-3">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  For power users. Directly control the reason code, target artifact, evidence bundle,
                  and JSON patches. The reason code determines which pipeline steps are re-run &mdash;
                  no separate &quot;mode&quot; selection is needed.
                </p>
              </div>
              <DisputePanel
                artifacts={resolutionArtifacts}
                collectors={selectedCollectors.length > 0 ? selectedCollectors : undefined}
                onSubmit={async (payload) => {
                  const res = await handleDisputeSubmit(payload);
                  handleDisputeResult(res);
                  return res;
                }}
                disabled={loading}
              />
            </details>
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No AI result available to dispute. Run Proof of Reasoning first.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
