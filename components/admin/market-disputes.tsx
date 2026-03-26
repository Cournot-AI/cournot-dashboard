"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useMemo } from "react";
import { callApi, InvalidCodeError } from "@/lib/oracle-api";
import { submitDispute, acceptDispute, fetchDisputes } from "@/lib/admin-api";
import type { Dispute } from "@/lib/types";
import type { ResolutionArtifacts, DisputeResponse } from "@/components/playground/dispute-panel";
import { DisputePanel } from "@/components/playground/dispute-panel";
import { LLMDisputePanel } from "@/components/playground/llm-dispute-panel";
import { DisputeDiff } from "@/components/playground/dispute-diff";
import { AiResultDetail } from "@/components/admin/ai-result-detail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Settings,
  Minus,
  Plus,
  Pencil,
  RotateCcw,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MarketDisputesProps {
  marketId: number;
  currentAiResult: string;
  currentAiOutcome: string;
  aiPrompt?: string;
  isAdmin: boolean;
  accessCode: string | null;
  onMarketUpdated: () => void;
  onRequestCode?: () => void;
}

interface CollectorInfo {
  id: string;
  name: string;
  description: string;
}

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

const COLLECTOR_DESCRIPTIONS: Record<string, string> = {
  CollectorOpenSearch: "Searches the web for relevant articles and news using open search queries.",
  CollectorSitePinned: "Fetches content from specific URLs referenced in the market description.",
  CollectorHyDE: "Hypothetical Document Embeddings — generates a hypothetical answer then searches for similar real content.",
  CollectorWebPageReader: "Reads and extracts content from specific web pages.",
  CollectorHTTP: "Direct HTTP requests to API endpoints or data sources.",
  CollectorMock: "Test collector that returns synthetic data.",
};

const PAGE_SIZE = 5;

// ─── Outcome helpers ────────────────────────────────────────────────────────

function extractPossibleOutcomes(aiPrompt?: string): string[] {
  if (!aiPrompt) return [];
  try {
    const parsed = JSON.parse(aiPrompt);
    const outcomes = parsed?.prompt_spec?.market?.possible_outcomes;
    if (Array.isArray(outcomes)) return outcomes.map(String);
  } catch { /* ignore */ }
  return [];
}

function OutcomeSelect({
  value,
  onValueChange,
  label = "Outcome *",
  placeholder = "Select...",
  possibleOutcomes,
}: {
  value: string;
  onValueChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  possibleOutcomes?: string[];
}) {
  const [customMode, setCustomMode] = useState(false);
  const options = possibleOutcomes && possibleOutcomes.length > 0
    ? [...possibleOutcomes.filter((o) => o !== "INVALID"), "INVALID"]
    : ["YES", "NO", "INVALID"];
  const effectiveCustom = customMode || (!!value && !options.includes(value));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <button
          type="button"
          onClick={() => setCustomMode(!effectiveCustom)}
          className="text-[10px] text-primary/70 hover:text-primary transition-colors"
        >
          {effectiveCustom ? "Use dropdown" : "Custom input"}
        </button>
      </div>
      {effectiveCustom ? (
        <Input value={value} onChange={(e) => onValueChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent>
            {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function MarketDisputes({
  marketId,
  currentAiResult,
  currentAiOutcome,
  aiPrompt,
  isAdmin,
  accessCode,
  onMarketUpdated,
  onRequestCode,
}: MarketDisputesProps) {
  const possibleOutcomes = extractPossibleOutcomes(aiPrompt);

  // ── Resolution artifacts (parsed from current ai_result) ──
  const initialArtifacts = useMemo<ResolutionArtifacts | null>(() => {
    if (!currentAiResult) return null;
    try {
      const parsed = JSON.parse(currentAiResult);
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
        tool_plan: arts.tool_plan ?? toolPlan,
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
  }, [currentAiResult, aiPrompt]);

  const [resolutionArtifacts, setResolutionArtifacts] = useState<ResolutionArtifacts | null>(null);

  useEffect(() => {
    if (initialArtifacts) {
      setResolutionArtifacts(initialArtifacts);
    }
  }, [initialArtifacts]);

  // ── Phase: "generate" or "review" ──
  const [phase, setPhase] = useState<"generate" | "review">("generate");

  // ── Dispute result tracking ──
  const [disputeRawResult, setDisputeRawResult] = useState<string | null>(null);
  const [beforeSnapshot, setBeforeSnapshot] = useState<{ verdict: any; reasoning_trace: any; evidence_bundles: any[] } | null>(null);
  const [disputeResponse, setDisputeResponse] = useState<DisputeResponse | null>(null);

  // ── Submit form state ──
  const [outcome, setOutcome] = useState(currentAiOutcome || "");
  const [confidence, setConfidence] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── Advanced edit state ──
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedJson, setAdvancedJson] = useState("");
  const [advancedJsonError, setAdvancedJsonError] = useState<string | null>(null);

  // ── Capabilities ──
  const [availableCollectors, setAvailableCollectors] = useState<CollectorInfo[]>([]);
  const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);
  const [collectorCounts, setCollectorCounts] = useState<Record<string, number>>({});
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [pipelineLoading, setPipelineLoading] = useState(false);

  const selectedCollectors = Object.entries(collectorCounts).flatMap(([id, count]) =>
    Array(count).fill(id)
  );

  // ── History state ──
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ── Fetch capabilities on mount ──
  useEffect(() => {
    if (!accessCode) return;
    callApi(accessCode, "/capabilities", {}, "GET")
      .then((data) => {
        if (Array.isArray(data.providers)) setProviders(data.providers);
        if (Array.isArray(data.steps)) {
          const collectorStep = data.steps.find(
            (s: CollectorStep) => s.step === "collector"
          ) as CollectorStep | undefined;
          if (collectorStep?.agents) {
            const collectors: CollectorInfo[] = collectorStep.agents.map((a: CollectorAgent) => ({
              id: a.name,
              name: (a.name as string).replace(/^Collector/, ""),
              description: a.description ?? "",
            }));
            setAvailableCollectors(collectors);
            const defaultIds = ["CollectorOpenSearch", "CollectorSitePinned", "CollectorHyDE"];
            const defaults: Record<string, number> = {};
            for (const id of defaultIds) {
              if (collectors.some((c) => c.id === id)) defaults[id] = 1;
            }
            if (Object.keys(defaults).length > 0) setCollectorCounts(defaults);
            else if (collectors.length > 0) setCollectorCounts({ [collectors[0].id]: 1 });
          }
        }
        setCapabilitiesLoaded(true);
      })
      .catch((err) => {
        // Capabilities are optional — dispute panels still work with artifact-embedded collectors
        setCapabilitiesLoaded(true);
        if (err instanceof InvalidCodeError) toast.error("Invalid access code");
        else toast.error("Failed to load pipeline settings", { description: err instanceof Error ? err.message : "Unknown error" });
      });
  }, [accessCode]);

  // ── Load dispute history ──
  const loadDisputes = useCallback(async () => {
    if (!accessCode) return;
    setLoadingHistory(true);
    try {
      const res = await fetchDisputes(accessCode, marketId, { page_num: page, page_size: PAGE_SIZE });
      setDisputes(res.disputes);
      setTotal(res.total);
    } catch { /* Error handled by admin-api */ }
    finally { setLoadingHistory(false); }
  }, [accessCode, marketId, page]);

  useEffect(() => { loadDisputes(); }, [loadDisputes]);

  // ── Update submit form when dispute result arrives ──
  useEffect(() => {
    if (!disputeRawResult) return;
    try {
      const parsed = JSON.parse(disputeRawResult);
      if (parsed.outcome) setOutcome(parsed.outcome);
      if (parsed.confidence != null) setConfidence(String(parsed.confidence));
      const r = parsed.artifacts?.reasoning_trace?.reasoning_summary
        ?? parsed.artifacts?.verdict?.metadata?.justification ?? "";
      if (r) setReasoning(r);
    } catch { /* ignore */ }
  }, [disputeRawResult]);

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
    const collectorsUsed = selectedCollectors.length > 0
      ? selectedCollectors
      : resolutionArtifacts?.collectors_used ?? [];

    const newEvidenceBundles = (a.evidence_bundles && a.evidence_bundles.length > 0)
      ? a.evidence_bundles
      : a.evidence_bundle
        ? [a.evidence_bundle]
        : resolutionArtifacts?.evidence_bundles ?? [];

    const newOutcome = a.verdict?.outcome ?? resolutionArtifacts?.verdict?.outcome ?? "UNKNOWN";
    const newConfidence = a.verdict?.confidence ?? a.verdict?.metadata?.confidence ?? resolutionArtifacts?.verdict?.confidence ?? 0;

    const newRaw = {
      ok: true, errors: [],
      outcome: newOutcome,
      confidence: newConfidence,
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
    setDisputeRawResult(JSON.stringify(newRaw));
    setDisputeResponse(response);

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

    // Transition to review phase
    setPhase("review");
  }

  // ── Reset back to generate phase ──
  function handleReset() {
    setPhase("generate");
    setDisputeRawResult(null);
    setDisputeResponse(null);
    setBeforeSnapshot(null);
    setAdvancedOpen(false);
    setAdvancedJsonError(null);
    // Reset form to current market values
    setOutcome(currentAiOutcome || "");
    setConfidence("");
    setReasoning("");
    // Restore initial artifacts so user can dispute again
    if (initialArtifacts) setResolutionArtifacts(initialArtifacts);
  }

  // ── Build ai_result for submission ──
  function buildAiResult(): string {
    const adminOutcome = outcome.trim();
    const adminConfidence = parseFloat(confidence) || 0;
    const adminReasoning = reasoning.trim() || undefined;

    const base = disputeRawResult || currentAiResult;
    if (base) {
      try {
        const parsed = JSON.parse(base);
        parsed.outcome = adminOutcome;
        parsed.confidence = adminConfidence;
        if (parsed.artifacts?.verdict) {
          parsed.artifacts.verdict.outcome = adminOutcome;
          parsed.artifacts.verdict.confidence = adminConfidence;
          if (parsed.artifacts.verdict.metadata) {
            parsed.artifacts.verdict.metadata.justification =
              adminReasoning ?? parsed.artifacts.verdict.metadata.justification;
          }
        }
        if (parsed.artifacts?.por_bundle?.verdict) {
          parsed.artifacts.por_bundle.verdict.outcome = adminOutcome;
          parsed.artifacts.por_bundle.verdict.confidence = adminConfidence;
        }
        return JSON.stringify(parsed);
      } catch { /* fall through */ }
    }
    return JSON.stringify({ ok: true, errors: [], outcome: adminOutcome, confidence: adminConfidence, reasoning: adminReasoning });
  }

  // ── Submit dispute to backend ──
  async function handleSubmitToBackend(e: React.FormEvent) {
    e.preventDefault();
    if (!accessCode || !outcome.trim()) return;
    setSubmitLoading(true);
    try {
      const proposedAiResult = advancedOpen ? advancedJson : buildAiResult();
      if (advancedOpen) {
        try { JSON.parse(proposedAiResult); } catch (err) {
          toast.error("Invalid JSON", { description: err instanceof Error ? err.message : "Cannot parse" });
          setSubmitLoading(false);
          return;
        }
      }
      await submitDispute(accessCode, marketId, proposedAiResult, reasoning.trim() || undefined);
      toast.success("Dispute submitted");
      handleReset();
      setPage(1);
      await loadDisputes();
      onMarketUpdated();
    } catch { /* Error handled by admin-api */ }
    finally { setSubmitLoading(false); }
  }

  // ── Accept dispute ──
  async function handleAccept(disputeId: number) {
    if (!accessCode) return;
    setAcceptingId(disputeId);
    try {
      await acceptDispute(accessCode, disputeId);
      toast.success("Dispute accepted — market updated");
      await loadDisputes();
      onMarketUpdated();
    } catch { /* Error handled by admin-api */ }
    finally { setAcceptingId(null); }
  }

  // ── Advanced edit helpers ──
  function openAdvanced() {
    const base = buildAiResult();
    try { setAdvancedJson(JSON.stringify(JSON.parse(base), null, 2)); }
    catch { setAdvancedJson(base); }
    setAdvancedJsonError(null);
    setAdvancedOpen(true);
  }

  function handleAdvancedJsonChange(value: string) {
    setAdvancedJson(value);
    try { JSON.parse(value); setAdvancedJsonError(null); }
    catch (e) { setAdvancedJsonError(e instanceof Error ? e.message : "Invalid JSON"); }
  }

  // ── No access code ──
  if (!accessCode) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            <button
              type="button"
              onClick={onRequestCode}
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Enter code
            </button>{" "}
            to dispute this resolution or view dispute history.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasArtifacts = resolutionArtifacts !== null;

  // ── Settings panel (collectors + provider) ──
  const settingsPanel = (
    <details className="rounded-lg border border-border/50 bg-muted/10">
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
            Select which data collectors to use for re-collecting evidence during dispute.
          </p>
          {!capabilitiesLoaded ? (
            <p className="text-xs text-muted-foreground/60 italic flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading collectors...
            </p>
          ) : availableCollectors.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 italic">
              No collectors available. Disputes will use the artifact-embedded collectors.
            </p>
          ) : (
            <div className="space-y-1.5">
              {availableCollectors.map((c) => {
                const count = collectorCounts[c.id] ?? 0;
                const isActive = count > 0;
                const desc = COLLECTOR_DESCRIPTIONS[c.id] || c.description || "";
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleCollector(c.id)} disabled={pipelineLoading}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors shrink-0 ${
                        isActive ? "border-primary/50 bg-primary/10 text-primary" : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/30"
                      } ${pipelineLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {c.name}
                    </button>
                    {isActive && (
                      <div className="inline-flex items-center gap-0.5 shrink-0">
                        <button type="button" onClick={() => setCollectorCount(c.id, count - 1)} disabled={pipelineLoading}
                          className="h-5 w-5 rounded border border-border/50 inline-flex items-center justify-center text-muted-foreground hover:bg-muted/30 disabled:opacity-50">
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="text-xs font-mono w-4 text-center">{count}</span>
                        <button type="button" onClick={() => setCollectorCount(c.id, count + 1)} disabled={pipelineLoading || count >= 5}
                          className="h-5 w-5 rounded border border-border/50 inline-flex items-center justify-center text-muted-foreground hover:bg-muted/30 disabled:opacity-50">
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                    {desc && <span className="text-[10px] text-muted-foreground/60 leading-tight truncate">{desc}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Provider</label>
            <Select value={selectedProvider ?? "__default__"}
              onValueChange={(v) => {
                if (v === "__default__") { setSelectedProvider(null); setSelectedModel(""); }
                else { setSelectedProvider(v); const p = providers.find((pr) => pr.provider === v); if (p) setSelectedModel(p.default_model); }
              }}
              disabled={pipelineLoading}>
              <SelectTrigger className="text-xs"><SelectValue placeholder="Server default" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">Server default</SelectItem>
                {providers.map((p) => <SelectItem key={p.provider} value={p.provider}>{p.provider}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Model</label>
            <Input value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
              disabled={pipelineLoading || !selectedProvider}
              placeholder={selectedProvider ? "model name" : "select provider first"}
              className="text-xs" />
          </div>
        </div>
      </div>
    </details>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">Disputes</CardTitle>
          {total > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{total}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dispute">
          <TabsList>
            <TabsTrigger value="dispute">Dispute</TabsTrigger>
            <TabsTrigger value="history">History{total > 0 ? ` (${total})` : ""}</TabsTrigger>
          </TabsList>

          {/* ── Dispute tab — single page with generate → review flow ── */}
          <TabsContent value="dispute" className="mt-4 space-y-4">
            {!hasArtifacts ? (
              <p className="text-xs text-muted-foreground italic">
                No AI result artifacts available to dispute. The market may have been resolved
                without a full PoR pipeline run.
              </p>
            ) : phase === "generate" ? (
              /* ── Phase 1: Generate ── */
              <>
                <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2 space-y-1.5">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Challenge the current resolved verdict. Use the LLM dispute (plain language)
                    or the advanced panel to re-run pipeline steps. After generating, you can review
                    the comparison and submit the dispute.
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Current outcome:</span>
                    <Badge variant="secondary">{currentAiOutcome || "—"}</Badge>
                  </div>
                </div>

                {settingsPanel}

                <details open>
                  <summary className="text-xs font-medium text-muted-foreground cursor-pointer mb-2">
                    LLM Dispute (plain language)
                  </summary>
                  <div className="rounded-lg border border-border/20 bg-muted/5 px-3 py-2 mb-3">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Describe what went wrong in plain language. The LLM will analyze your message and
                      determine which steps to re-run. Any URLs or domains mentioned will be automatically
                      extracted and used as evidence.
                    </p>
                  </div>
                  <LLMDisputePanel
                    artifacts={resolutionArtifacts!}
                    collectors={selectedCollectors.length > 0 ? selectedCollectors : undefined}
                    submitLabel="Generate Dispute"
                    onSubmit={async (payload) => {
                      setPipelineLoading(true);
                      setBeforeSnapshot({ verdict: resolutionArtifacts!.verdict, reasoning_trace: resolutionArtifacts!.reasoning_trace, evidence_bundles: resolutionArtifacts!.evidence_bundles ?? [] });
                      try {
                        const res = await handleLLMDisputeSubmit(payload);
                        handleDisputeResult(res);
                        return res;
                      } finally {
                        setPipelineLoading(false);
                      }
                    }}
                    disabled={pipelineLoading}
                  />
                </details>

                <details>
                  <summary className="text-xs font-medium text-muted-foreground cursor-pointer mb-2">
                    Advanced Dispute (technical)
                  </summary>
                  <div className="rounded-lg border border-border/20 bg-muted/5 px-3 py-2 mb-3">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      For power users. Directly control the reason code, target artifact, evidence bundle,
                      and JSON patches.
                    </p>
                  </div>
                  <DisputePanel
                    artifacts={resolutionArtifacts!}
                    collectors={selectedCollectors.length > 0 ? selectedCollectors : undefined}
                    submitLabel="Generate Dispute"
                    onSubmit={async (payload) => {
                      setPipelineLoading(true);
                      setBeforeSnapshot({ verdict: resolutionArtifacts!.verdict, reasoning_trace: resolutionArtifacts!.reasoning_trace, evidence_bundles: resolutionArtifacts!.evidence_bundles ?? [] });
                      try {
                        const res = await handleDisputeSubmit(payload);
                        handleDisputeResult(res);
                        return res;
                      } finally {
                        setPipelineLoading(false);
                      }
                    }}
                    disabled={pipelineLoading}
                  />
                </details>

                {/* Greyed-out submit section */}
                <div className="rounded-lg border border-border/20 bg-muted/5 p-4 opacity-40 pointer-events-none select-none">
                  <p className="text-xs text-muted-foreground mb-3">
                    Generate a dispute above to review and submit the result.
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-xl">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Outcome</label>
                      <div className="h-9 rounded-md border border-border bg-muted/20" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Confidence</label>
                      <div className="h-9 rounded-md border border-border bg-muted/20" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ── Phase 2: Review & Submit ── */
              <>
                {/* Comparison diff */}
                {disputeResponse && beforeSnapshot && (
                  <DisputeDiff
                    beforeVerdict={beforeSnapshot.verdict}
                    afterVerdict={disputeResponse.artifacts?.verdict}
                    beforeReasoning={beforeSnapshot.reasoning_trace}
                    afterReasoning={disputeResponse.artifacts?.reasoning_trace}
                    beforeEvidence={beforeSnapshot.evidence_bundles}
                    afterEvidence={
                      disputeResponse.artifacts?.evidence_bundles?.length
                        ? disputeResponse.artifacts.evidence_bundles
                        : disputeResponse.artifacts?.evidence_bundle
                          ? [disputeResponse.artifacts.evidence_bundle]
                          : beforeSnapshot.evidence_bundles
                    }
                  />
                )}

                {/* Submit form or advanced editor */}
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Review the updated verdict above. Edit the outcome, confidence, and reasoning
                    below, or use <strong>Advanced Edit</strong> to modify the full JSON.
                  </p>

                  {!advancedOpen ? (
                    <form onSubmit={handleSubmitToBackend} className="space-y-4 max-w-xl">
                      <div className="grid grid-cols-2 gap-4">
                        <OutcomeSelect
                          value={outcome}
                          onValueChange={setOutcome}
                          possibleOutcomes={possibleOutcomes}
                        />
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Confidence (0-1)</label>
                          <Input
                            type="number" step="0.01" min="0" max="1"
                            value={confidence}
                            onChange={(e) => setConfidence(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Reasoning</label>
                        <Textarea
                          value={reasoning}
                          onChange={(e) => setReasoning(e.target.value)}
                          placeholder="Reasoning for this outcome..."
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={submitLoading || !outcome.trim()}
                          className="h-9 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          {submitLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Submit Dispute
                        </button>
                        <button
                          type="button"
                          onClick={openAdvanced}
                          disabled={submitLoading}
                          className="h-9 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Advanced Edit
                        </button>
                        <button
                          type="button"
                          onClick={handleReset}
                          disabled={submitLoading}
                          className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Regenerate
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={advancedJson}
                        onChange={(e) => handleAdvancedJsonChange(e.target.value)}
                        spellCheck={false}
                        className="w-full h-[50vh] rounded-lg border border-border bg-muted/20 p-3 text-xs font-mono text-foreground resize-none focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {advancedJsonError && (
                        <p className="text-xs text-red-400">JSON error: {advancedJsonError}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSubmitToBackend as any}
                          disabled={submitLoading || !!advancedJsonError}
                          className="h-9 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          {submitLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Submit Dispute with Edits
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              setAdvancedJson(JSON.stringify(JSON.parse(advancedJson), null, 2));
                              setAdvancedJsonError(null);
                              toast.success("JSON formatted");
                            } catch (err) {
                              toast.error("Cannot format", { description: err instanceof Error ? err.message : "Invalid JSON" });
                            }
                          }}
                          className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
                        >
                          Format JSON
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdvancedOpen(false)}
                          className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
                        >
                          Back to Simple
                        </button>
                        <button
                          type="button"
                          onClick={handleReset}
                          disabled={submitLoading}
                          className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Regenerate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── History tab ── */}
          <TabsContent value="history" className="mt-4 space-y-3">
            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : disputes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No disputes submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {disputes.map((d) => (
                  <DisputeItem
                    key={d.id}
                    dispute={d}
                    isAdmin={isAdmin}
                    accepting={acceptingId === d.id}
                    onAccept={() => handleAccept(d.id)}
                  />
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-1">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                      className="h-7 rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1">
                      <ChevronLeft className="h-3 w-3" /> Prev
                    </button>
                    <span className="text-[10px] text-muted-foreground">{page} / {totalPages}</span>
                    <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                      className="h-7 rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1">
                      Next <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ── Individual dispute history item ──

function DisputeItem({
  dispute,
  isAdmin,
  accepting,
  onAccept,
}: {
  dispute: Dispute;
  isAdmin: boolean;
  accepting: boolean;
  onAccept: () => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"comparison" | "proposed" | "previous">("comparison");
  const created = new Date(dispute.created_time);

  // Parse previous / proposed ai_results for detail view
  let prevParsed: any = null;
  let propParsed: any = null;
  try { prevParsed = JSON.parse(dispute.previous_ai_result); } catch { /* ignore */ }
  try { propParsed = JSON.parse(dispute.proposed_ai_result); } catch { /* ignore */ }

  const prevVerdict = prevParsed?.artifacts?.verdict;
  const propVerdict = propParsed?.artifacts?.verdict;
  const prevReasoning = prevParsed?.artifacts?.reasoning_trace;
  const propReasoning = propParsed?.artifacts?.reasoning_trace;
  const prevBundles = prevParsed?.artifacts?.evidence_bundles ?? [];
  const propBundles = propParsed?.artifacts?.evidence_bundles ?? [];

  return (
    <>
      <div className="rounded-lg border border-border p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">{dispute.previous_ai_outcome || "—"}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
          <span className="font-medium">{dispute.proposed_ai_outcome || "—"}</span>
        </div>
        {dispute.reason && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">{dispute.reason}</p>
        )}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
          <span>{dispute.submitted_by}</span>
          <span>&middot;</span>
          <span>
            {created.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
            {created.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          {dispute.is_accepted ? (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px] h-5">
              Accepted
              {dispute.accepted_by && <span className="ml-1 opacity-70">by {dispute.accepted_by}</span>}
            </Badge>
          ) : (
            <>
              <Badge variant="outline" className="text-[10px] h-5">Pending</Badge>
              {isAdmin && (
                <button type="button" onClick={onAccept} disabled={accepting}
                  className="h-6 rounded-md bg-emerald-600 px-2 text-[10px] font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 inline-flex items-center gap-1">
                  {accepting && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                  Accept
                </button>
              )}
            </>
          )}
          {/* Detail button */}
          {(propParsed || prevParsed) && (
            <button type="button" onClick={() => setDetailOpen(true)}
              className="h-6 rounded-md border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors inline-flex items-center gap-1">
              <Eye className="h-2.5 w-2.5" />
              Details
            </button>
          )}
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Dispute #{dispute.id} &mdash; {dispute.previous_ai_outcome || "—"} &rarr; {dispute.proposed_ai_outcome || "—"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Submitted by {dispute.submitted_by} on{" "}
              {created.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {dispute.reason && <> &mdash; {dispute.reason}</>}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={detailTab} onValueChange={(v) => setDetailTab(v as typeof detailTab)} className="flex-1 min-h-0 flex flex-col">
            <TabsList className="w-fit">
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="proposed">Proposed Result</TabsTrigger>
              <TabsTrigger value="previous">Previous Result</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-4 pb-2">
                <DisputeDiff
                  beforeVerdict={prevVerdict}
                  afterVerdict={propVerdict}
                  beforeReasoning={prevReasoning}
                  afterReasoning={propReasoning}
                  beforeEvidence={prevBundles}
                  afterEvidence={propBundles}
                />
              </div>
            </TabsContent>

            <TabsContent value="proposed" className="flex-1 min-h-0 overflow-y-auto">
              {dispute.proposed_ai_result ? (
                <AiResultDetail aiResult={dispute.proposed_ai_result} />
              ) : (
                <p className="text-xs text-muted-foreground italic py-4">No proposed result data.</p>
              )}
            </TabsContent>

            <TabsContent value="previous" className="flex-1 min-h-0 overflow-y-auto">
              {dispute.previous_ai_result ? (
                <AiResultDetail aiResult={dispute.previous_ai_result} />
              ) : (
                <p className="text-xs text-muted-foreground italic py-4">No previous result data.</p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
