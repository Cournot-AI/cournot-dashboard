"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import { useRole } from "@/lib/role";
import { updateMarket } from "@/lib/admin-api";
import type { RunSummary } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, ArrowLeft, Pencil, ChevronDown, Plus, Trash2, Clock } from "lucide-react";

// ── Summarized Fields types ──

interface ReasoningStep {
  step_id: string;
  step_type: string;
  output_summary: string;
  conclusion: string;
}

interface AdminEvidenceItem {
  source_uri: string;
  source_name: string;
  tier: string;
  parsed_excerpt: string;
  supports: string;
}

function makeEmptyEvidenceItem(): AdminEvidenceItem {
  return { source_uri: "", source_name: "", tier: "1", parsed_excerpt: "", supports: "YES" };
}

interface BundleOption {
  index: number;
  bundle_id: string;
  collector_name: string;
  item_count: number;
}

interface SummarizedFields {
  outcome: string;
  confidence: string;
  verdictJustification: string;
  llmReviewFinalJustification: string;
  llmReviewOutcome: string;
  llmReviewConfidence: string;
  evidenceSummary: string;
  reasoningSummary: string;
  preliminaryOutcome: string;
  preliminaryConfidence: string;
  reasoningSteps: ReasoningStep[];
  // Evidence
  bundleOptions: BundleOption[];
  selectedBundleIndex: string; // stringified index for Select
  newEvidenceItems: AdminEvidenceItem[];
}

// ── Extraction / application helpers ──

function extractSummarizedFields(json: any): SummarizedFields {
  const verdict = json?.artifacts?.verdict ?? {};
  const verdictMeta = verdict?.metadata ?? {};
  const llmReview = verdictMeta?.llm_review ?? {};
  const trace = json?.artifacts?.reasoning_trace ?? {};
  const steps: any[] = trace?.reasoning_steps ?? [];
  const bundles: any[] = json?.artifacts?.evidence_bundles ?? [];

  const bundleOptions: BundleOption[] = bundles.map((b: any, i: number) => ({
    index: i,
    bundle_id: b?.bundle_id ?? `bundle_${i}`,
    collector_name: b?.collector_name ?? "Unknown",
    item_count: Array.isArray(b?.items) ? b.items.length : 0,
  }));

  return {
    outcome: json?.outcome ?? verdict?.outcome ?? "",
    confidence:
      json?.confidence != null
        ? String(json.confidence)
        : verdict?.confidence != null
          ? String(verdict.confidence)
          : "",
    verdictJustification: verdictMeta?.justification ?? "",
    llmReviewFinalJustification: llmReview?.final_justification ?? "",
    llmReviewOutcome: llmReview?.outcome ?? "",
    llmReviewConfidence:
      llmReview?.confidence != null ? String(llmReview.confidence) : "",
    evidenceSummary: trace?.evidence_summary ?? "",
    reasoningSummary: trace?.reasoning_summary ?? "",
    preliminaryOutcome: trace?.preliminary_outcome ?? "",
    preliminaryConfidence:
      trace?.preliminary_confidence != null
        ? String(trace.preliminary_confidence)
        : "",
    reasoningSteps: steps.map((s: any) => ({
      step_id: s?.step_id ?? "",
      step_type: s?.step_type ?? "",
      output_summary: s?.output_summary ?? "",
      conclusion: s?.conclusion ?? "",
    })),
    bundleOptions,
    selectedBundleIndex: bundleOptions.length > 0 ? "0" : "",
    newEvidenceItems: [],
  };
}

function applySummarizedFields(json: any, fields: SummarizedFields): any {
  const out = JSON.parse(JSON.stringify(json)); // deep clone
  const adminOutcome = fields.outcome.trim();
  const adminConfidence = parseFloat(fields.confidence) || 0;

  // Top-level
  out.outcome = adminOutcome;
  out.confidence = adminConfidence;

  // artifacts.verdict
  if (!out.artifacts) out.artifacts = {};
  if (!out.artifacts.verdict) out.artifacts.verdict = {};
  out.artifacts.verdict.outcome = adminOutcome;
  out.artifacts.verdict.confidence = adminConfidence;
  if (!out.artifacts.verdict.metadata) out.artifacts.verdict.metadata = {};
  out.artifacts.verdict.metadata.justification = fields.verdictJustification;

  // llm_review inside verdict metadata
  if (!out.artifacts.verdict.metadata.llm_review)
    out.artifacts.verdict.metadata.llm_review = {};
  out.artifacts.verdict.metadata.llm_review.final_justification =
    fields.llmReviewFinalJustification;
  if (fields.llmReviewOutcome) {
    out.artifacts.verdict.metadata.llm_review.outcome = fields.llmReviewOutcome;
  }
  if (fields.llmReviewConfidence) {
    out.artifacts.verdict.metadata.llm_review.confidence =
      parseFloat(fields.llmReviewConfidence) || 0;
  }

  // artifacts.reasoning_trace
  if (!out.artifacts.reasoning_trace) out.artifacts.reasoning_trace = {};
  out.artifacts.reasoning_trace.evidence_summary = fields.evidenceSummary;
  out.artifacts.reasoning_trace.reasoning_summary = fields.reasoningSummary;
  if (fields.preliminaryOutcome) {
    out.artifacts.reasoning_trace.preliminary_outcome =
      fields.preliminaryOutcome;
  }
  if (fields.preliminaryConfidence) {
    out.artifacts.reasoning_trace.preliminary_confidence =
      parseFloat(fields.preliminaryConfidence) || 0;
  }

  // reasoning_steps — update in-place, preserving extra keys
  if (
    out.artifacts.reasoning_trace.reasoning_steps &&
    Array.isArray(out.artifacts.reasoning_trace.reasoning_steps)
  ) {
    fields.reasoningSteps.forEach((fs, i) => {
      if (i < out.artifacts.reasoning_trace.reasoning_steps.length) {
        out.artifacts.reasoning_trace.reasoning_steps[i].output_summary =
          fs.output_summary;
        out.artifacts.reasoning_trace.reasoning_steps[i].conclusion =
          fs.conclusion;
      }
    });
  }

  // Admin-added evidence items — append to selected bundle
  if (fields.newEvidenceItems.length > 0 && fields.selectedBundleIndex !== "") {
    const bi = parseInt(fields.selectedBundleIndex, 10);
    if (!out.artifacts.evidence_bundles) out.artifacts.evidence_bundles = [];
    if (bi >= 0 && bi < out.artifacts.evidence_bundles.length) {
      const bundle = out.artifacts.evidence_bundles[bi];
      if (!Array.isArray(bundle.items)) bundle.items = [];
      for (const item of fields.newEvidenceItems) {
        if (!item.source_uri.trim() && !item.parsed_excerpt.trim()) continue;
        bundle.items.push({
          evidence_id: `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          source_uri: item.source_uri,
          source_name: item.source_name || "Admin-added",
          tier: parseInt(item.tier, 10) || 1,
          fetched_at: new Date().toISOString(),
          content_hash: "",
          parsed_excerpt: item.parsed_excerpt,
          status_code: 200,
          success: true,
          extracted_fields: {
            outcome: item.supports === "N/A" ? "Unresolved" : item.supports === "YES" ? "Yes" : "No",
            supports: item.supports,
          },
        });
      }
    }
  }

  // por_bundle sync
  if (out.artifacts?.por_bundle?.verdict) {
    out.artifacts.por_bundle.verdict.outcome = adminOutcome;
    out.artifacts.por_bundle.verdict.confidence = adminConfidence;
    if (out.artifacts.por_bundle.verdict.metadata) {
      out.artifacts.por_bundle.verdict.metadata.justification =
        fields.verdictJustification;
    }
  }

  return out;
}

// ── Outcome helpers ──

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

  // If the current value doesn't match any option, start in custom mode
  const effectiveCustom = customMode || (!!value && !options.includes(value));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <button
          type="button"
          onClick={() => { setCustomMode(!effectiveCustom); }}
          className="text-[10px] text-primary/70 hover:text-primary transition-colors"
        >
          {effectiveCustom ? "Use dropdown" : "Custom input"}
        </button>
      </div>
      {effectiveCustom ? (
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// ── Main component ──

const SILENCE_PRESETS: { label: string; minutes: number }[] = [
  { label: "15 minutes", minutes: 15 },
  { label: "1 hour", minutes: 60 },
  { label: "3 hours", minutes: 180 },
  { label: "6 hours", minutes: 360 },
  { label: "12 hours", minutes: 720 },
  { label: "24 hours", minutes: 1440 },
];

interface ResolveFormProps {
  marketId: number;
  porResult: RunSummary | null;
  rawAiResult?: string;
  aiPrompt?: string;
  onResolved?: () => void;
  onRevertToMonitoring?: (silenceDeadline: string) => void;
}

export function ResolveForm({ marketId, porResult, rawAiResult, aiPrompt, onResolved, onRevertToMonitoring }: ResolveFormProps) {
  const possibleOutcomes = extractPossibleOutcomes(aiPrompt);
  const { accessCode } = useRole();
  const [loading, setLoading] = useState(false);

  // Extract initial values from existing rawAiResult if available
  function parseRawAiResult(): { outcome: string; confidence: string; reasoning: string } {
    if (!rawAiResult) return { outcome: "", confidence: "", reasoning: "" };
    try {
      const parsed = JSON.parse(rawAiResult);
      return {
        outcome: parsed.outcome ?? "",
        confidence: parsed.confidence != null ? String(parsed.confidence) : "",
        reasoning:
          parsed.artifacts?.reasoning_trace?.reasoning_summary ??
          parsed.artifacts?.verdict?.metadata?.justification ??
          "",
      };
    } catch {
      return { outcome: "", confidence: "", reasoning: "" };
    }
  }

  const initial = parseRawAiResult();
  const [outcome, setOutcome] = useState(porResult?.outcome ?? initial.outcome);
  const [confidence, setConfidence] = useState(
    porResult?.confidence != null ? String(porResult.confidence) : initial.confidence
  );
  const [reasoning, setReasoning] = useState(
    porResult?.reasoning_summary ?? initial.reasoning
  );

  // Update when PoR result arrives (re-run or dispute)
  useEffect(() => {
    if (porResult) {
      setOutcome(porResult.outcome);
      setConfidence(String(porResult.confidence));
      if (porResult.reasoning_summary) {
        setReasoning(porResult.reasoning_summary);
      }
    }
  }, [porResult]);

  // Update from rawAiResult when it changes (dispute updates, rerun, etc.)
  useEffect(() => {
    if (rawAiResult) {
      const vals = parseRawAiResult();
      if (vals.outcome) setOutcome(vals.outcome);
      if (vals.confidence) setConfidence(vals.confidence);
      if (vals.reasoning) setReasoning(vals.reasoning);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawAiResult]);

  /** Build the ai_result string to send to backend. */
  function buildAiResult(): string {
    const adminOutcome = outcome.trim();
    const adminConfidence = parseFloat(confidence) || 0;
    const adminReasoning = reasoning.trim() || undefined;

    if (rawAiResult) {
      try {
        const parsed = JSON.parse(rawAiResult);
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
          if (parsed.artifacts.por_bundle.verdict.metadata) {
            parsed.artifacts.por_bundle.verdict.metadata.justification =
              adminReasoning ?? parsed.artifacts.por_bundle.verdict.metadata.justification;
          }
        }
        return JSON.stringify(parsed);
      } catch {
        // fall through
      }
    }

    return JSON.stringify({
      ok: true,
      errors: [],
      outcome: adminOutcome,
      confidence: adminConfidence,
      reasoning: adminReasoning,
      por_root: porResult?.por_root || undefined,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessCode || !outcome.trim()) return;
    setLoading(true);
    try {
      await updateMarket(accessCode, marketId, {
        status: "resolved",
        ai_result: buildAiResult(),
      });
      toast.success("Market resolved");
      onResolved?.();
    } catch {
      // Error handled by admin-api
    } finally {
      setLoading(false);
    }
  }

  // ── Revert to Monitoring dialog state ──
  const [revertOpen, setRevertOpen] = useState(false);
  const [revertLoading, setRevertLoading] = useState(false);
  const [customHours, setCustomHours] = useState("");

  function computeDeadline(minutes: number): string {
    return new Date(Date.now() + minutes * 60 * 1000).toISOString();
  }

  async function handleRevert(minutes: number) {
    if (!onRevertToMonitoring) return;
    setRevertLoading(true);
    try {
      await onRevertToMonitoring(computeDeadline(minutes));
      setRevertOpen(false);
      setCustomHours("");
    } finally {
      setRevertLoading(false);
    }
  }

  // ── Advanced Edit dialog state ──
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedJson, setAdvancedJson] = useState("");
  const [advancedJsonError, setAdvancedJsonError] = useState<string | null>(null);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedTab, setAdvancedTab] = useState<string>("summarized");
  const [summarizedFields, setSummarizedFields] = useState<SummarizedFields | null>(null);

  const initSummarizedFromJson = useCallback((jsonStr: string): SummarizedFields | null => {
    try {
      const parsed = JSON.parse(jsonStr);
      return extractSummarizedFields(parsed);
    } catch {
      return null;
    }
  }, []);

  function handleOpenAdvanced() {
    const base = buildAiResult();
    let prettyJson: string;
    try {
      prettyJson = JSON.stringify(JSON.parse(base), null, 2);
    } catch {
      prettyJson = base;
    }
    setAdvancedJson(prettyJson);
    setAdvancedJsonError(null);
    setSummarizedFields(initSummarizedFromJson(prettyJson));
    setAdvancedTab("summarized");
    setAdvancedOpen(true);
  }

  function handleAdvancedJsonChange(value: string) {
    setAdvancedJson(value);
    try {
      JSON.parse(value);
      setAdvancedJsonError(null);
    } catch (e) {
      setAdvancedJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  // Tab switch sync
  function handleTabChange(newTab: string) {
    if (newTab === advancedTab) return;

    if (advancedTab === "summarized" && newTab === "raw" && summarizedFields) {
      // Apply summarized fields into JSON
      try {
        const parsed = JSON.parse(advancedJson);
        const updated = applySummarizedFields(parsed, summarizedFields);
        const pretty = JSON.stringify(updated, null, 2);
        setAdvancedJson(pretty);
        setAdvancedJsonError(null);
      } catch {
        // If JSON was invalid, build from scratch with a minimal base
        const minimal = { ok: true, errors: [], outcome: "", confidence: 0, artifacts: {} };
        const updated = applySummarizedFields(minimal, summarizedFields);
        const pretty = JSON.stringify(updated, null, 2);
        setAdvancedJson(pretty);
        setAdvancedJsonError(null);
      }
    } else if (advancedTab === "raw" && newTab === "summarized") {
      // Parse JSON into summarized fields
      try {
        const parsed = JSON.parse(advancedJson);
        setSummarizedFields(extractSummarizedFields(parsed));
      } catch {
        toast.error("Cannot switch to Summarized Fields", {
          description: "Fix the JSON errors first.",
        });
        return; // block tab switch
      }
    }

    setAdvancedTab(newTab);
  }

  // Summarized field updaters
  function updateSummarized<K extends keyof SummarizedFields>(
    key: K,
    value: SummarizedFields[K]
  ) {
    setSummarizedFields((prev) =>
      prev ? { ...prev, [key]: value } : prev
    );
  }

  function updateStep(index: number, field: keyof ReasoningStep, value: string) {
    setSummarizedFields((prev) => {
      if (!prev) return prev;
      const steps = [...prev.reasoningSteps];
      steps[index] = { ...steps[index], [field]: value };
      return { ...prev, reasoningSteps: steps };
    });
  }

  function addEvidenceItem() {
    setSummarizedFields((prev) =>
      prev
        ? { ...prev, newEvidenceItems: [...prev.newEvidenceItems, makeEmptyEvidenceItem()] }
        : prev
    );
  }

  function removeEvidenceItem(index: number) {
    setSummarizedFields((prev) => {
      if (!prev) return prev;
      const items = prev.newEvidenceItems.filter((_, i) => i !== index);
      return { ...prev, newEvidenceItems: items };
    });
  }

  function updateEvidenceItem(index: number, field: keyof AdminEvidenceItem, value: string) {
    setSummarizedFields((prev) => {
      if (!prev) return prev;
      const items = [...prev.newEvidenceItems];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, newEvidenceItems: items };
    });
  }

  async function handleAdvancedSubmit() {
    if (!accessCode) return;

    let finalJson = advancedJson;

    // If on summarized tab, apply fields to JSON first
    if (advancedTab === "summarized" && summarizedFields) {
      try {
        const parsed = JSON.parse(advancedJson);
        const updated = applySummarizedFields(parsed, summarizedFields);
        finalJson = JSON.stringify(updated);
      } catch {
        const minimal = { ok: true, errors: [], outcome: "", confidence: 0, artifacts: {} };
        const updated = applySummarizedFields(minimal, summarizedFields);
        finalJson = JSON.stringify(updated);
      }
    }

    // Validate JSON
    try {
      JSON.parse(finalJson);
    } catch (e) {
      toast.error("Invalid JSON", {
        description: e instanceof Error ? e.message : "Cannot parse JSON",
      });
      return;
    }

    setAdvancedLoading(true);
    try {
      await updateMarket(accessCode, marketId, {
        status: "resolved",
        ai_result: finalJson,
      });
      toast.success("Market resolved with manual edits");
      setAdvancedOpen(false);
      onResolved?.();
    } catch {
      // Error handled by admin-api
    } finally {
      setAdvancedLoading(false);
    }
  }

  return (
    <>
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-green-400 mb-1 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Final Resolve
          </p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xl leading-relaxed">
            This form constructs the final <span className="font-mono text-[11px]">ai_result</span> from
            the fields below and resolves the market. If a PoR run or dispute result exists, your
            outcome, confidence, and reasoning will be merged into the full artifacts JSON.
            <strong className="text-amber-400"> Once resolved, the market outcome is final and cannot be changed.</strong>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <OutcomeSelect
                  value={outcome}
                  onValueChange={setOutcome}
                  possibleOutcomes={possibleOutcomes}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Confidence (0-1)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
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
                disabled={loading || !outcome.trim()}
                className="h-9 rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-600/90 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Final Resolve
              </button>
              <button
                type="button"
                onClick={handleOpenAdvanced}
                disabled={loading}
                className="h-9 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Pencil className="h-3.5 w-3.5" />
                Advanced Edit
              </button>
              {onRevertToMonitoring && (
                <button
                  type="button"
                  onClick={() => setRevertOpen(true)}
                  disabled={loading}
                  className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Revert to Monitoring
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Revert to Monitoring Dialog */}
      <Dialog open={revertOpen} onOpenChange={setRevertOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Revert to Monitoring</DialogTitle>
            <DialogDescription className="text-xs">
              Choose how long to silence this market before it can be flagged again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              {SILENCE_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => handleRevert(preset.minutes)}
                  disabled={revertLoading}
                  className="h-9 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <Clock className="h-3 w-3" />
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="border-t border-border pt-3">
              <label className="text-xs text-muted-foreground mb-1.5 block">Custom duration (hours)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.5"
                  min="0.25"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  placeholder="e.g. 48"
                  className="text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const h = parseFloat(customHours);
                    if (!h || h <= 0) {
                      toast.error("Enter a valid number of hours");
                      return;
                    }
                    handleRevert(h * 60);
                  }}
                  disabled={revertLoading || !customHours}
                  className="h-9 shrink-0 rounded-lg border border-border px-4 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRevertOpen(false)}
              className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advanced Edit Dialog */}
      <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm">Advanced Edit &mdash; ai_result</DialogTitle>
            <DialogDescription className="text-xs">
              Edit the ai_result using summarized fields or raw JSON. Changes sync when switching tabs.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={advancedTab} onValueChange={handleTabChange} className="flex-1 min-h-0 flex flex-col">
            <TabsList className="w-fit">
              <TabsTrigger value="summarized">Summarized Fields</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>

            {/* ── Summarized Fields tab ── */}
            <TabsContent value="summarized" className="flex-1 min-h-0 overflow-y-auto pr-1">
              {summarizedFields && (
                <div className="space-y-6 pb-2">
                  {/* Verdict */}
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Verdict
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <OutcomeSelect
                          value={summarizedFields.outcome}
                          onValueChange={(v) => updateSummarized("outcome", v)}
                          label="Outcome"
                          possibleOutcomes={possibleOutcomes}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Confidence (0-1)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={summarizedFields.confidence}
                          onChange={(e) => updateSummarized("confidence", e.target.value)}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Justifications */}
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Justifications
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Verdict Justification
                        </label>
                        <Textarea
                          value={summarizedFields.verdictJustification}
                          onChange={(e) =>
                            updateSummarized("verdictJustification", e.target.value)
                          }
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          LLM Review &mdash; Final Justification
                        </label>
                        <Textarea
                          value={summarizedFields.llmReviewFinalJustification}
                          onChange={(e) =>
                            updateSummarized("llmReviewFinalJustification", e.target.value)
                          }
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <OutcomeSelect
                            value={summarizedFields.llmReviewOutcome}
                            onValueChange={(v) =>
                              updateSummarized("llmReviewOutcome", v)
                            }
                            label="LLM Review Outcome"
                            possibleOutcomes={possibleOutcomes}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            LLM Review Confidence
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={summarizedFields.llmReviewConfidence}
                            onChange={(e) =>
                              updateSummarized("llmReviewConfidence", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Reasoning Trace */}
                  <section>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Reasoning Trace
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Evidence Summary
                        </label>
                        <Textarea
                          value={summarizedFields.evidenceSummary}
                          onChange={(e) =>
                            updateSummarized("evidenceSummary", e.target.value)
                          }
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Reasoning Summary
                        </label>
                        <Textarea
                          value={summarizedFields.reasoningSummary}
                          onChange={(e) =>
                            updateSummarized("reasoningSummary", e.target.value)
                          }
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <OutcomeSelect
                            value={summarizedFields.preliminaryOutcome}
                            onValueChange={(v) =>
                              updateSummarized("preliminaryOutcome", v)
                            }
                            label="Preliminary Outcome"
                            possibleOutcomes={possibleOutcomes}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Preliminary Confidence
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={summarizedFields.preliminaryConfidence}
                            onChange={(e) =>
                              updateSummarized("preliminaryConfidence", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Reasoning Steps */}
                  {summarizedFields.reasoningSteps.length > 0 && (
                    <section>
                      <details>
                        <summary className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 cursor-pointer select-none flex items-center gap-1">
                          <ChevronDown className="h-3 w-3 transition-transform [[open]>&]:rotate-180" />
                          Reasoning Steps ({summarizedFields.reasoningSteps.length})
                        </summary>
                        <div className="space-y-4 mt-3">
                          {summarizedFields.reasoningSteps.map((step, i) => (
                            <div
                              key={step.step_id || i}
                              className="rounded-lg border border-border p-3 space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px]">
                                  {step.step_id}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                  {step.step_type}
                                </Badge>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Output Summary
                                </label>
                                <Textarea
                                  value={step.output_summary}
                                  onChange={(e) =>
                                    updateStep(i, "output_summary", e.target.value)
                                  }
                                  rows={2}
                                  className="text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Conclusion
                                </label>
                                <Input
                                  value={step.conclusion}
                                  onChange={(e) =>
                                    updateStep(i, "conclusion", e.target.value)
                                  }
                                  className="text-xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </section>
                  )}

                  {/* Add Evidence */}
                  {summarizedFields.bundleOptions.length > 0 && (
                    <section>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Add Evidence
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Target Bundle
                          </label>
                          <Select
                            value={summarizedFields.selectedBundleIndex}
                            onValueChange={(v) => updateSummarized("selectedBundleIndex", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a bundle..." />
                            </SelectTrigger>
                            <SelectContent>
                              {summarizedFields.bundleOptions.map((b) => (
                                <SelectItem key={b.index} value={String(b.index)}>
                                  {b.collector_name} ({b.item_count} items)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {summarizedFields.newEvidenceItems.map((item, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-border p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">
                                New Item #{i + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeEvidenceItem(i)}
                                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Source URL
                                </label>
                                <Input
                                  value={item.source_uri}
                                  onChange={(e) =>
                                    updateEvidenceItem(i, "source_uri", e.target.value)
                                  }
                                  placeholder="https://..."
                                  className="text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Source Name
                                </label>
                                <Input
                                  value={item.source_name}
                                  onChange={(e) =>
                                    updateEvidenceItem(i, "source_name", e.target.value)
                                  }
                                  placeholder="e.g. Reuters"
                                  className="text-xs"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Tier
                                </label>
                                <Select
                                  value={item.tier}
                                  onValueChange={(v) => updateEvidenceItem(i, "tier", v)}
                                >
                                  <SelectTrigger className="text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1 - Authoritative</SelectItem>
                                    <SelectItem value="2">2 - Reputable</SelectItem>
                                    <SelectItem value="3">3 - Low-confidence</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Supports
                                </label>
                                <Select
                                  value={item.supports}
                                  onValueChange={(v) => updateEvidenceItem(i, "supports", v)}
                                >
                                  <SelectTrigger className="text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="YES">YES</SelectItem>
                                    <SelectItem value="NO">NO</SelectItem>
                                    <SelectItem value="N/A">N/A</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                Excerpt / Key Fact
                              </label>
                              <Textarea
                                value={item.parsed_excerpt}
                                onChange={(e) =>
                                  updateEvidenceItem(i, "parsed_excerpt", e.target.value)
                                }
                                rows={2}
                                placeholder="Key information from this source..."
                                className="text-xs"
                              />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addEvidenceItem}
                          className="h-8 rounded-lg border border-dashed border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/30 inline-flex items-center gap-1.5"
                        >
                          <Plus className="h-3 w-3" />
                          Add Evidence Item
                        </button>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── Raw JSON tab ── */}
            <TabsContent value="raw" className="flex-1 min-h-0 space-y-2">
              <textarea
                value={advancedJson}
                onChange={(e) => handleAdvancedJsonChange(e.target.value)}
                spellCheck={false}
                className="w-full h-[60vh] rounded-lg border border-border bg-muted/20 p-3 text-xs font-mono text-foreground resize-none focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {advancedJsonError && (
                <p className="text-xs text-red-400">
                  JSON error: {advancedJsonError}
                </p>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setAdvancedOpen(false)}
              className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            {advancedTab === "raw" && (
              <button
                type="button"
                onClick={() => {
                  try {
                    setAdvancedJson(JSON.stringify(JSON.parse(advancedJson), null, 2));
                    setAdvancedJsonError(null);
                    toast.success("JSON formatted");
                  } catch (e) {
                    toast.error("Cannot format", {
                      description: e instanceof Error ? e.message : "Invalid JSON",
                    });
                  }
                }}
                className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
              >
                Format JSON
              </button>
            )}
            <button
              type="button"
              onClick={handleAdvancedSubmit}
              disabled={advancedLoading || (advancedTab === "raw" && !!advancedJsonError)}
              className="h-9 rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-600/90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {advancedLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Resolve with Manual Edits
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
