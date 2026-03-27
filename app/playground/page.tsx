"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { ParseResult, RunSummary, ExecutionLog, TemporalConstraint, QualityScorecard } from "@/lib/types";
import { callApi, InvalidCodeError, buildRunSummary, toRunSummary } from "@/lib/oracle-api";
import { PlaygroundInput } from "@/components/playground/playground-input";
import { PlaygroundResults } from "@/components/playground/playground-results";
import type { ResolutionArtifacts } from "@/components/playground/dispute-panel";
import type { ValidationResult } from "@/components/playground/validation-card";
import {
  PipelineProgress,
  PipelineStep,
  createInitialSteps,
  updateStepStatus,
} from "@/components/playground/pipeline-progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import {
  trackPlaygroundCodeEntered,
  trackPlaygroundPrompt,
  trackPlaygroundResolve,
  trackPlaygroundProviderChange,
  trackPlaygroundCollectorToggle,
  trackPlaygroundReset,
  trackPlaygroundStepComplete,
} from "@/lib/analytics";
import { useRole } from "@/lib/role";

// ─── Code-gated API helper ──────────────────────────────────────────────────

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProviderInfo {
  provider: string;
  default_model: string;
}

interface CollectorInfo {
  id: string;
  name: string;
  description: string;
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

interface EvidenceBundleData {
  items?: unknown[];
}

type Phase = "input" | "prompting" | "prompted" | "resolving" | "resolved";

// ─── Page Component ─────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  // Access code
  const { accessCode, login, logout, isLoading: codeLoading } = useRole();
  const codeLoaded = !codeLoading;
  const [codeInput, setCodeInput] = useState("");

  const handleInvalidCode = useCallback(() => {
    logout();
    toast.error("Invalid access code", { description: "Please re-enter your code." });
  }, [logout]);

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = codeInput.trim();
    if (!code) return;
    login(code).then(() => {
      setCodeInput("");
      trackPlaygroundCodeEntered(code);
    }).catch(() => {});
  }

  function handleChangeCode() {
    logout();
  }

  // Phase
  const [phase, setPhase] = useState<Phase>("input");

  // Input state
  const [userInput, setUserInput] = useState("");

  // Collector selection (for multi-step mode)
  const [availableCollectors, setAvailableCollectors] = useState<CollectorInfo[]>([]);
  const [collectorCounts, setCollectorCounts] = useState<Record<string, number>>({});

  // Derive selectedCollectors from counts (e.g. {GeminiGrounded: 2} => ['GeminiGrounded', 'GeminiGrounded'])
  const selectedCollectors = Object.entries(collectorCounts).flatMap(([id, count]) =>
    Array(count).fill(id)
  );

  // LLM provider/model selection
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("");

  // Fetch capabilities via ai_data
  useEffect(() => {
    if (!accessCode) return;

    callApi(accessCode, "/capabilities", {}, "GET")
      .then((data) => {
        if (Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
        if (Array.isArray(data.steps)) {
          const collectorStep = data.steps.find((s: CollectorStep) => s.step === "collector") as CollectorStep | undefined;
          if (collectorStep && Array.isArray(collectorStep.agents)) {
            const collectors: CollectorInfo[] = collectorStep.agents.map((a: CollectorAgent) => ({
              id: a.name,
              name: (a.name as string).replace(/^Collector/, ""),
              description: a.description ?? "",
            }));
            setAvailableCollectors(collectors);
            const defaultCollector = collectorStep.agents.find((a: CollectorAgent) => !a.is_fallback);
            if (defaultCollector) {
              setCollectorCounts({ [defaultCollector.name]: 1 });
            } else if (collectors.length > 0) {
              setCollectorCounts({ [collectors[0].id]: 1 });
            }
          }
        }
      })
      .catch((err) => {
        if (err instanceof InvalidCodeError) {
          handleInvalidCode();
        } else {
          console.warn("Failed to fetch capabilities:", err);
          toast.error("Failed to load capabilities", {
            description: err instanceof Error ? err.message : "Collector and provider options may not be available.",
          });
        }
      });
  }, [accessCode, handleInvalidCode]);

  // Results
  const [promptResult, setPromptResult] = useState<ParseResult | null>(null);
  const [resolveResult, setResolveResult] = useState<RunSummary | null>(null);
  const [resolutionArtifacts, setResolutionArtifacts] = useState<ResolutionArtifacts | null>(null);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Pipeline progress
  const [useMultiStep, setUseMultiStep] = useState(true);
  const [skipQualityCheck, setSkipQualityCheck] = useState(true);

  function createSteps() {
    const steps = createInitialSteps();
    return skipQualityCheck ? steps.filter((s) => s.id !== "quality_check") : steps;
  }

  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(createSteps);

  const isLoading = phase === "prompting" || phase === "resolving";
  const hasResults = phase === "prompted" || phase === "resolved";

  function handleReset() {
    setPhase("input");
    setUserInput("");
    setCollectorCounts(availableCollectors.length > 0 ? { [availableCollectors[0].id]: 1 } : {});
    setSelectedProvider(null);
    setSelectedModel("");
    setPromptResult(null);
    setResolveResult(null);
    setResolutionArtifacts(null);
    setExecutionLogs([]);
    setValidationResult(null);
    setPipelineSteps(createSteps());
    if (accessCode) trackPlaygroundReset(accessCode);
  }

  function toggleCollector(collectorId: string) {
    const willSelect = !(collectorCounts[collectorId] > 0);
    if (accessCode) trackPlaygroundCollectorToggle(accessCode, collectorId, willSelect);
    setCollectorCounts((prev) => {
      const next = { ...prev };
      if (next[collectorId] > 0) {
        // Don't allow removing the last collector
        const totalEnabled = Object.values(next).reduce((s, c) => s + c, 0);
        if (totalEnabled <= next[collectorId]) return prev;
        delete next[collectorId];
      } else {
        next[collectorId] = 1;
      }

      const enabledIds = Object.keys(next).filter((id) => next[id] > 0);
      const hasGemini = enabledIds.some((c) => c.toLowerCase().includes("geminigrounded"));
      const onlyGemini = hasGemini && enabledIds.length === 1;

      if (onlyGemini) {
        const googleProvider = providers.find((p) => p.provider.toLowerCase() === "google");
        if (googleProvider) {
          setSelectedProvider(googleProvider.provider);
          setSelectedModel(googleProvider.default_model);
        }
      }

      return next;
    });
  }

  function setCollectorCount(collectorId: string, count: number) {
    setCollectorCounts((prev) => {
      const next = { ...prev };
      if (count <= 0) {
        // Don't allow removing the last collector
        const totalEnabled = Object.values(next).reduce((s, c) => s + c, 0);
        if (totalEnabled <= (next[collectorId] ?? 0)) return prev;
        delete next[collectorId];
      } else {
        next[collectorId] = Math.min(count, 5);
      }
      return next;
    });
  }

  async function handlePrompt() {
    if (!accessCode) return;
    trackPlaygroundPrompt(accessCode, userInput.length);
    setPhase("prompting");
    setPromptResult(null);
    setResolveResult(null);
    setResolutionArtifacts(null);
    setExecutionLogs([]);
    setValidationResult(null);
    setPipelineSteps(createSteps());
    setPipelineSteps((prev) => updateStepStatus(prev, "prompt", "running"));

    try {
      const data = await callApi(accessCode, "/validate", {
        user_input: userInput,
        ...(selectedProvider && { llm_provider: selectedProvider }),
        ...(selectedProvider && selectedModel && { llm_model: selectedModel }),
      });

      // Extract validation result (classification, checks, resolvability, source_reachability)
      if (data?.classification) {
        setValidationResult(data);
      }

      // Extract prompt compilation result (prompt_spec, tool_plan) into ParseResult
      const parseResult: ParseResult = {
        ok: data?.ok ?? false,
        prompt_spec: data?.prompt_spec ?? null,
        tool_plan: data?.tool_plan ?? null,
        error: (data?.errors ?? []).length > 0 ? data.errors.join("; ") : null,
        metadata: data?.prompt_metadata ?? { compiler: "llm", strict_mode: true, question_type: "unknown" },
      };
      setPromptResult(parseResult);
      const dataReqCount = parseResult.prompt_spec?.data_requirements?.length ?? 0;
      const ruleCount = parseResult.prompt_spec?.market?.resolution_rules?.length ?? 0;
      setPipelineSteps((prev) =>
        updateStepStatus(
          prev,
          "prompt",
          "completed",
          `Spec compiled -- ${dataReqCount} data req${dataReqCount !== 1 ? "s" : ""}, ${ruleCount} rule${ruleCount !== 1 ? "s" : ""}`
        )
      );
      trackPlaygroundStepComplete(accessCode, "prompt", true);
      setPhase("prompted");
    } catch (err) {
      trackPlaygroundStepComplete(accessCode, "prompt", false);
      if (err instanceof InvalidCodeError) {
        handleInvalidCode();
        setPhase("input");
        return;
      }
      setPipelineSteps((prev) => updateStepStatus(prev, "prompt", "error"));
      toast.error("Prompt failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setPhase("input");
    }
  }

  async function handleResolveMultiStep() {
    if (!accessCode || !promptResult?.prompt_spec || !promptResult?.tool_plan) return;

    setPhase("resolving");
    const steps = createSteps();
    steps[0].status = "completed";
    setPipelineSteps(steps);

    const promptSpec = promptResult.prompt_spec;
    const toolPlan = promptResult.tool_plan;

    // Extract temporal constraint from prompt_spec.extra (may be null)
    const temporalConstraint: TemporalConstraint | null =
      (promptSpec?.extra?.temporal_constraint as TemporalConstraint) ?? null;

    try {
      // Step 2: Collect
      setPipelineSteps((prev) => updateStepStatus(prev, "collect", "running"));
      const collectData = await callApi(accessCode, "/step/collect", {
        prompt_spec: promptSpec,
        tool_plan: toolPlan,
        collectors: selectedCollectors,
        ...(selectedProvider && { llm_provider: selectedProvider }),
        ...(selectedProvider && selectedModel && { llm_model: selectedModel }),
      });
      if (Array.isArray(collectData.execution_logs)) {
        setExecutionLogs(collectData.execution_logs);
      }
      if (collectData.ok === false || (Array.isArray(collectData.errors) && collectData.errors.length > 0)) {
        const errMsg = collectData.errors?.join("; ") || "Collect returned errors";
        setPipelineSteps((prev) => updateStepStatus(prev, "collect", "error"));
        throw new Error(errMsg);
      }
      let evidenceBundles = collectData.evidence_bundles;
      const totalEvidence = Array.isArray(evidenceBundles)
        ? evidenceBundles.reduce((sum: number, b: EvidenceBundleData) => sum + (b?.items?.length ?? 0), 0)
        : 0;
      const bundleCount = Array.isArray(evidenceBundles) ? evidenceBundles.length : 0;
      setPipelineSteps((prev) =>
        updateStepStatus(
          prev,
          "collect",
          "completed",
          `Collected ${totalEvidence} evidence item${totalEvidence !== 1 ? "s" : ""} from ${bundleCount} source${bundleCount !== 1 ? "s" : ""}`
        )
      );
      trackPlaygroundStepComplete(accessCode, "collect", true);

      // Step 3: Quality check + retry loop (up to 2 retries)
      let qualityScorecard: QualityScorecard | null = null;
      if (skipQualityCheck) {
        // quality_check step is excluded from the pipeline display
      } else {
        setPipelineSteps((prev) => updateStepStatus(prev, "quality_check", "running"));
        const MAX_QC_RETRIES = 2;
        for (let i = 0; i < MAX_QC_RETRIES; i++) {
          const qcData = await callApi(accessCode, "/step/quality_check", {
            prompt_spec: promptSpec,
            evidence_bundles: evidenceBundles,
          });

          if (!qcData.ok) break;
          qualityScorecard = qcData.scorecard;

          if (qcData.meets_threshold) break; // quality is good enough

          const retryHints = qualityScorecard?.retry_hints;
          if (!retryHints || Object.keys(retryHints).length === 0) break;

          // Retry collect with feedback
          const retryData = await callApi(accessCode, "/step/collect", {
            prompt_spec: promptSpec,
            tool_plan: toolPlan,
            collectors: ["CollectorOpenSearch"],
            quality_feedback: retryHints,
            ...(selectedProvider && { llm_provider: selectedProvider }),
            ...(selectedProvider && selectedModel && { llm_model: selectedModel }),
          });
          if (retryData.ok !== false && Array.isArray(retryData.evidence_bundles)) {
            evidenceBundles = [...evidenceBundles, ...retryData.evidence_bundles];
          }
        }
        const qualityLevel = qualityScorecard?.quality_level ?? "N/A";
        const coveragePct = qualityScorecard?.requirements_coverage != null
          ? `${Math.round(qualityScorecard.requirements_coverage * 100)}%`
          : "N/A";
        setPipelineSteps((prev) =>
          updateStepStatus(
            prev,
            "quality_check",
            "completed",
            `Quality: ${qualityLevel} | Coverage: ${coveragePct} | ${qualityScorecard?.meets_threshold ? "Passed" : "Below threshold"}`
          )
        );
        trackPlaygroundStepComplete(accessCode, "quality_check", true);
      }

      // Step 4: Audit
      setPipelineSteps((prev) => updateStepStatus(prev, "audit", "running"));
      const auditData = await callApi(accessCode, "/step/audit", {
        prompt_spec: promptSpec,
        evidence_bundles: evidenceBundles,
        ...(qualityScorecard && { quality_scorecard: qualityScorecard }),
        ...(temporalConstraint && { temporal_constraint: temporalConstraint }),
        ...(selectedProvider && { llm_provider: selectedProvider }),
        ...(selectedProvider && selectedModel && { llm_model: selectedModel }),
      });
      if (auditData.ok === false || (Array.isArray(auditData.errors) && auditData.errors.length > 0)) {
        const errMsg = auditData.errors?.join("; ") || "Audit returned errors";
        setPipelineSteps((prev) => updateStepStatus(prev, "audit", "error"));
        throw new Error(errMsg);
      }
      const reasoningTrace = auditData.reasoning_trace;
      const reasoningStepCount = Array.isArray(reasoningTrace?.steps) ? reasoningTrace.steps.length : 0;
      const reasoningSummarySnippet = reasoningTrace?.reasoning_summary
        ? reasoningTrace.reasoning_summary.slice(0, 60) + (reasoningTrace.reasoning_summary.length > 60 ? "..." : "")
        : null;
      setPipelineSteps((prev) =>
        updateStepStatus(
          prev,
          "audit",
          "completed",
          reasoningSummarySnippet
            ? `${reasoningStepCount} reasoning step${reasoningStepCount !== 1 ? "s" : ""} -- ${reasoningSummarySnippet}`
            : `Completed ${reasoningStepCount} reasoning step${reasoningStepCount !== 1 ? "s" : ""}`
        )
      );
      trackPlaygroundStepComplete(accessCode, "audit", true);

      // Step 5: Judge
      setPipelineSteps((prev) => updateStepStatus(prev, "judge", "running"));
      const judgeData = await callApi(accessCode, "/step/judge", {
        prompt_spec: promptSpec,
        evidence_bundles: evidenceBundles,
        reasoning_trace: reasoningTrace,
        ...(qualityScorecard && { quality_scorecard: qualityScorecard }),
        ...(temporalConstraint && { temporal_constraint: temporalConstraint }),
        ...(selectedProvider && { llm_provider: selectedProvider }),
        ...(selectedProvider && selectedModel && { llm_model: selectedModel }),
      });
      if (judgeData.ok === false || (Array.isArray(judgeData.errors) && judgeData.errors.length > 0)) {
        const errMsg = judgeData.errors?.join("; ") || "Judge returned errors";
        setPipelineSteps((prev) => updateStepStatus(prev, "judge", "error"));
        throw new Error(errMsg);
      }
      const verdict = judgeData.verdict;
      const outcome = judgeData.outcome;
      const confidence = judgeData.confidence;
      const confidencePct = confidence != null ? `${Math.round(confidence * 100)}%` : "N/A";
      setPipelineSteps((prev) =>
        updateStepStatus(
          prev,
          "judge",
          "completed",
          `Verdict: ${outcome ?? "UNKNOWN"} at ${confidencePct} confidence`
        )
      );
      trackPlaygroundStepComplete(accessCode, "judge", true);

      // Step 6: Bundle
      setPipelineSteps((prev) => updateStepStatus(prev, "bundle", "running"));
      const bundleData = await callApi(accessCode, "/step/bundle", {
        prompt_spec: promptSpec,
        evidence_bundles: evidenceBundles,
        reasoning_trace: reasoningTrace,
        verdict: verdict,
      });
      if (bundleData.ok === false || (Array.isArray(bundleData.errors) && bundleData.errors.length > 0)) {
        const errMsg = bundleData.errors?.join("; ") || "Bundle returned errors";
        setPipelineSteps((prev) => updateStepStatus(prev, "bundle", "error"));
        throw new Error(errMsg);
      }
      const porBundle = bundleData.por_bundle;
      const porRoot = bundleData.por_root;
      const porRootShort = typeof porRoot === "string" && porRoot.length > 8
        ? `${porRoot.slice(0, 8)}...`
        : porRoot ?? "N/A";
      setPipelineSteps((prev) =>
        updateStepStatus(
          prev,
          "bundle",
          "completed",
          `Proof bundle created -- root: ${porRootShort}`
        )
      );
      trackPlaygroundStepComplete(accessCode, "bundle", true);

      // Build final result
      const summary = buildRunSummary(
        evidenceBundles,
        reasoningTrace,
        verdict,
        porBundle,
        outcome,
        confidence,
        porRoot
      );

      console.log("resolveResult:", JSON.stringify(summary, null, 2));
      setResolutionArtifacts({
        prompt_spec: promptSpec,
        tool_plan: toolPlan,
        collectors_used: selectedCollectors,
        evidence_bundles: evidenceBundles,
        reasoning_trace: reasoningTrace,
        verdict,
        por_bundle: porBundle,
        quality_scorecard: qualityScorecard,
        temporal_constraint: temporalConstraint,
      });
      setResolveResult(summary);
      setPhase("resolved");
    } catch (err) {
      if (err instanceof InvalidCodeError) {
        handleInvalidCode();
        setPhase("input");
        return;
      }
      toast.error("Resolution failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setPhase("prompted");
    }
  }

  async function handleResolveSingleCall() {
    if (!accessCode || !promptResult?.prompt_spec || !promptResult?.tool_plan) return;

    setPhase("resolving");

    try {
      const data = await callApi(accessCode, "/step/resolve", {
        prompt_spec: promptResult.prompt_spec,
        tool_plan: promptResult.tool_plan,
        execution_mode: "development",
        ...(selectedProvider && { llm_provider: selectedProvider }),
        ...(selectedProvider && selectedModel && { llm_model: selectedModel }),
      });

      const summary = toRunSummary(data);
      console.log("resolveResult:", JSON.stringify(summary, null, 2));
      const artifacts = data?.artifacts ?? {};
      setResolutionArtifacts({
        prompt_spec: artifacts.prompt_spec ?? promptResult.prompt_spec,
        tool_plan: promptResult.tool_plan,
        collectors_used: selectedCollectors,
        evidence_bundles: artifacts.evidence_bundles ?? (artifacts.evidence_bundle ? [artifacts.evidence_bundle] : []),
        reasoning_trace: artifacts.reasoning_trace,
        verdict: artifacts.verdict,
        por_bundle: artifacts.por_bundle,
      });
      setResolveResult(summary);
      setPhase("resolved");
    } catch (err) {
      if (err instanceof InvalidCodeError) {
        handleInvalidCode();
        setPhase("input");
        return;
      }
      toast.error("Resolve failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setPhase("prompted");
    }
  }

  function handleResolve() {
    if (accessCode) {
      trackPlaygroundResolve(
        accessCode,
        useMultiStep ? "multi_step" : "single_call",
        selectedCollectors
      );
    }
    if (useMultiStep) {
      handleResolveMultiStep();
    } else {
      handleResolveSingleCall();
    }
  }

  // ─── Code gate ──────────────────────────────────────────────────────────────

  if (!codeLoaded) {
    return null;
  }

  if (!accessCode) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-sm border-border/50 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
          <CardContent className="pt-6 pb-6 space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20">
                <Lock className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold">Access Code Required</h2>
              <p className="text-sm text-muted-foreground">
                Enter your access code to use the playground.
              </p>
            </div>
            <form onSubmit={handleCodeSubmit} className="space-y-3">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter code"
                autoFocus
                className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
              <button
                type="submit"
                disabled={!codeInput.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enter Playground
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main playground UI ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Playground</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Test market questions against the oracle pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Multi-step toggle */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={useMultiStep}
              onChange={(e) => setUseMultiStep(e.target.checked)}
              className="rounded border-border"
              disabled={isLoading}
            />
            Multi-step mode
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={skipQualityCheck}
              onChange={(e) => setSkipQualityCheck(e.target.checked)}
              className="rounded border-border"
              disabled={isLoading}
            />
            Skip quality check
          </label>
          <button
            onClick={handleChangeCode}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Lock className="h-3 w-3" />
            Change Code
          </button>
          {phase !== "input" && (
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Input form container with transition */}
      <div
        className={cn(
          "transition-all duration-500",
          phase === "input"
            ? "min-h-[50vh] flex items-center justify-center"
            : "min-h-0"
        )}
      >
        <div className={cn(phase === "input" ? "w-full max-w-2xl" : "w-full")}>
          <PlaygroundInput
            userInput={userInput}
            onUserInputChange={setUserInput}
            onPrompt={handlePrompt}
            onResolve={handleResolve}
            canResolve={
              promptResult !== null &&
              promptResult.ok &&
              promptResult.prompt_spec !== null &&
              promptResult.tool_plan !== null
            }
            isLoading={isLoading}
            compact={hasResults}
            useMultiStep={useMultiStep}
            availableCollectors={availableCollectors}
            selectedCollectors={selectedCollectors}
            collectorCounts={collectorCounts}
            onToggleCollector={toggleCollector}
            onCollectorCountChange={setCollectorCount}
            deferredSources={promptResult?.prompt_spec?.data_requirements?.every(
              (dr) => dr.deferred_source_discovery
            )}
            providers={providers}
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            onProviderChange={(p) => {
              setSelectedProvider(p);
              if (accessCode) trackPlaygroundProviderChange(accessCode, p, selectedModel);
            }}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>

      {/* Pipeline Progress (multi-step mode) */}
      {phase === "resolving" && useMultiStep && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <PipelineProgress steps={pipelineSteps} currentStep={null} />
        </div>
      )}

      {/* Simple loading (single-call mode or prompting) */}
      {phase === "prompting" && (
        <div className="animate-in fade-in duration-300">
          <div className="rounded-xl border border-border/50 bg-card/50 p-6">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
              <span className="text-sm text-muted-foreground">Compiling prompt specification...</span>
            </div>
          </div>
        </div>
      )}
      {phase === "resolving" && !useMultiStep && (
        <div className="animate-in fade-in duration-300">
          <div className="rounded-xl border border-border/50 bg-card/50 p-6">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
              <span className="text-sm text-muted-foreground">Resolving market question...</span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {hasResults && promptResult && (
        <PlaygroundResults
          promptResult={promptResult}
          resolveResult={resolveResult}
          userInput={userInput}
          executionLogs={executionLogs}
          resolutionArtifacts={resolutionArtifacts}
          validationResult={validationResult}
          onSubmitDispute={async (payload) => {
            if (!accessCode) throw new Error("Missing access code");
            return callApi(accessCode, "/dispute", payload, "POST");
          }}
          onSubmitLLMDispute={async (payload) => {
            if (!accessCode) throw new Error("Missing access code");
            return callApi(accessCode, "/dispute/llm", payload, "POST");
          }}
        />
      )}
    </div>
  );
}
