"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X, Loader2, MessageSquare, Link, AlertTriangle } from "lucide-react";
import type { ResolutionArtifacts, DisputeResponse } from "@/components/playground/dispute-panel";
import { DisputeDiff } from "@/components/playground/dispute-diff";

// ─── Reason code options with human-readable labels ─────────────────────────

type LLMDisputeReasonCode =
  | "EVIDENCE_MISREAD"
  | "EVIDENCE_INSUFFICIENT"
  | "REASONING_ERROR"
  | "LOGIC_GAP"
  | "OTHER";

const REASON_OPTIONS: { value: LLMDisputeReasonCode; label: string; description: string; steps: string }[] = [
  {
    value: "EVIDENCE_MISREAD",
    label: "Evidence Misread",
    description: "The system misinterpreted or misquoted the evidence",
    steps: "collect \u2192 audit \u2192 judge",
  },
  {
    value: "EVIDENCE_INSUFFICIENT",
    label: "Evidence Insufficient",
    description: "Key evidence was missing or not considered",
    steps: "collect \u2192 audit \u2192 judge",
  },
  {
    value: "REASONING_ERROR",
    label: "Reasoning Error",
    description: "The logic or inference chain has a flaw",
    steps: "audit \u2192 judge",
  },
  {
    value: "LOGIC_GAP",
    label: "Logic Gap",
    description: "A step in the reasoning is unsupported or skipped",
    steps: "audit \u2192 judge",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Something else is wrong",
    steps: "audit \u2192 judge",
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

interface LLMDisputePanelProps {
  artifacts: ResolutionArtifacts;
  onSubmit: (payload: any) => Promise<DisputeResponse>;
  disabled?: boolean;
  /** Override collectors to use instead of artifacts.collectors_used */
  collectors?: string[];
}

export function LLMDisputePanel({
  artifacts,
  onSubmit,
  disabled = false,
  collectors,
}: LLMDisputePanelProps) {
  const [reasonCode, setReasonCode] = useState<LLMDisputeReasonCode>("EVIDENCE_MISREAD");
  const [message, setMessage] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DisputeResponse | null>(null);
  const [beforeSnapshot, setBeforeSnapshot] = useState<{ verdict: any; reasoning_trace: any } | null>(null);

  const currentReason = REASON_OPTIONS.find((r) => r.value === reasonCode);

  function addUrl() {
    if (evidenceUrls.length >= 10) {
      toast.error("Maximum 10 URLs allowed");
      return;
    }
    setEvidenceUrls((prev) => [...prev, ""]);
  }

  function removeUrl(index: number) {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function updateUrl(index: number, value: string) {
    setEvidenceUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  }

  async function handleSubmit() {
    if (!message.trim()) {
      toast.error("Please explain why you disagree with the verdict");
      return;
    }
    if (message.trim().length > 4000) {
      toast.error("Message is too long", {
        description: `${message.trim().length} / 4000 characters`,
      });
      return;
    }

    // Filter out empty entries — accept full URLs or bare domains (e.g. "espn.com")
    const urls = evidenceUrls.map((u) => u.trim()).filter(Boolean);
    for (const url of urls) {
      // Allow bare domains (no protocol) — backend accepts them
      if (url.includes("://")) {
        try {
          new URL(url);
        } catch {
          toast.error("Invalid URL", { description: url });
          return;
        }
      }
    }

    const payload: Record<string, any> = {
      reason_code: reasonCode,
      message: message.trim(),
      prompt_spec: artifacts.prompt_spec,
    };

    if (urls.length > 0) {
      payload.evidence_urls = urls;
    }

    // Attach context artifacts when available
    const bundles = artifacts.evidence_bundles ?? [];
    if (bundles.length > 0) {
      payload.evidence_bundle = bundles[0];
    }
    if (artifacts.reasoning_trace) {
      payload.reasoning_trace = artifacts.reasoning_trace;
    }
    if (artifacts.tool_plan) {
      payload.tool_plan = artifacts.tool_plan;
    }
    const collectorsToUse = collectors && collectors.length > 0 ? collectors : artifacts.collectors_used;
    if (collectorsToUse && collectorsToUse.length > 0) {
      payload.collectors = collectorsToUse;
    }

    setSubmitting(true);
    // Snapshot current values before onSubmit triggers parent state updates
    setBeforeSnapshot({ verdict: artifacts.verdict, reasoning_trace: artifacts.reasoning_trace });
    try {
      const res = await onSubmit(payload);
      setResult(res);
      toast.success("Dispute processed", {
        description: `Reran: ${res.rerun_plan?.join(", ") || "(unknown)"}`,
      });
    } catch (e) {
      toast.error("Dispute failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-violet-400" />
            Dispute Verdict
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Describe what went wrong in plain language. The system will use an LLM to figure out
            which artifacts to re-run and how.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 1. Reason Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">What went wrong?</label>
            <Select
              value={reasonCode}
              onValueChange={(v) => setReasonCode(v as LLMDisputeReasonCode)}
              disabled={disabled || submitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentReason && (
              <p className="text-[11px] text-muted-foreground">
                {currentReason.description}
                <span className="text-muted-foreground/60"> &mdash; runs: {currentReason.steps}</span>
              </p>
            )}
          </div>

          {/* 2. Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Your explanation
              </label>
              <span
                className={cn(
                  "text-[10px] font-mono",
                  message.length > 4000 ? "text-red-400" : "text-muted-foreground"
                )}
              >
                {message.length} / 4000
              </span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={disabled || submitting}
              placeholder="Explain why you disagree with the verdict. Be specific — mention particular evidence, dates, sources, or reasoning steps that were wrong..."
              className="resize-y"
            />
          </div>

          {/* 3. Evidence URLs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Link className="h-3 w-3" />
                Supporting evidence URLs
                <span className="text-muted-foreground/60 font-normal">(optional)</span>
              </label>
              {evidenceUrls.length < 10 && (
                <button
                  type="button"
                  onClick={addUrl}
                  disabled={disabled || submitting}
                  className={cn(
                    "text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors",
                    (disabled || submitting) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Plus className="h-3 w-3" />
                  Add URL
                </button>
              )}
            </div>
            {evidenceUrls.length === 0 && (
              <p className="text-[11px] text-muted-foreground/60 italic">
                No URLs added. Click &quot;Add URL&quot; to include links to supporting evidence.
              </p>
            )}
            {evidenceUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={url}
                  onChange={(e) => updateUrl(idx, e.target.value)}
                  disabled={disabled || submitting}
                  placeholder="https://..."
                  className="text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => removeUrl(idx)}
                  disabled={disabled || submitting}
                  className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground">
              {evidenceUrls.length > 0
                ? "The system will fetch and analyze these pages as additional evidence."
                : "URLs and domains mentioned in your explanation above are automatically extracted and used as evidence. Add URLs here to explicitly include additional sources (they will be deduplicated with extracted ones)."}
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSubmit}
              disabled={disabled || submitting || !message.trim()}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                "bg-violet-500/20 text-violet-200 border border-violet-500/40 hover:bg-violet-500/30",
                (disabled || submitting || !message.trim()) && "opacity-50 cursor-not-allowed"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Dispute"
              )}
            </button>
            {submitting && (
              <span className="text-xs text-muted-foreground animate-pulse">
                LLM is analyzing your dispute...
              </span>
            )}
          </div>

          {/* Info note */}
          <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              The LLM will decide which pipeline steps to re-run based on your explanation.
              Context from the current resolution (evidence, reasoning, prompt spec) is sent automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Result diff */}
      {result && beforeSnapshot && (
        <DisputeDiff
          beforeVerdict={beforeSnapshot.verdict}
          afterVerdict={result.artifacts?.verdict}
          beforeReasoning={beforeSnapshot.reasoning_trace}
          afterReasoning={result.artifacts?.reasoning_trace}
        />
      )}
    </div>
  );
}
