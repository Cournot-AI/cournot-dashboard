"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export type DisputeReasonCode =
  | "REASONING_ERROR"
  | "LOGIC_GAP"
  | "EVIDENCE_MISREAD"
  | "EVIDENCE_INSUFFICIENT"
  | "OTHER";

export type DisputeTargetArtifact =
  | "evidence_bundle"
  | "reasoning_trace"
  | "verdict"
  | "prompt_spec";

export interface ResolutionArtifacts {
  prompt_spec: any;
  tool_plan?: any;
  collectors_used?: string[];
  evidence_bundles: any[];
  reasoning_trace: any;
  verdict: any;
  por_bundle?: any;
  quality_scorecard?: any;
  temporal_constraint?: any;
}

export interface DisputeResponse {
  ok: true;
  case_id?: string | null;
  rerun_plan: string[];
  artifacts: {
    prompt_spec: any;
    evidence_bundle: any;
    evidence_bundles?: any[];
    reasoning_trace: any;
    verdict: any;
  };
  diff?: any;
}

interface DisputePanelProps {
  artifacts: ResolutionArtifacts;
  onSubmit: (payload: any) => Promise<DisputeResponse>;
  disabled?: boolean;
  defaultCaseId?: string;
  onResult?: (result: DisputeResponse, meta: { before: ResolutionArtifacts; evidenceBundleIndex: number }) => void;
  /** Override collectors to use instead of artifacts.collectors_used */
  collectors?: string[];
  /** Override the submit button label (default: "Submit dispute") */
  submitLabel?: string;
}

export function DisputePanel({
  artifacts,
  onSubmit,
  disabled = false,
  submitLabel = "Submit dispute",
  defaultCaseId,
  onResult,
  collectors,
}: DisputePanelProps) {
  const [reasonCode, setReasonCode] = useState<DisputeReasonCode>("REASONING_ERROR");
  const [targetArtifact, setTargetArtifact] = useState<DisputeTargetArtifact>("verdict");
  const [leafPath, setLeafPath] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [caseId, setCaseId] = useState<string>(defaultCaseId ?? "");

  const [bundleIndex, setBundleIndex] = useState<number>(0);

  // Evidence patch (append items)
  const [appendItemsJson, setAppendItemsJson] = useState<string>("[]");

  // Prompt spec override (partial JSON; merged server-side)
  const [promptSpecOverrideJson, setPromptSpecOverrideJson] = useState<string>("{}");

  const [evidenceUrlsText, setEvidenceUrlsText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const selectedEvidenceBundle = useMemo(() => {
    const bundles = artifacts.evidence_bundles ?? [];
    return bundles[Math.max(0, Math.min(bundleIndex, bundles.length - 1))] ?? null;
  }, [artifacts.evidence_bundles, bundleIndex]);

  async function handleSubmit() {
    if (!selectedEvidenceBundle) {
      toast.error("No evidence bundle available");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a dispute message");
      return;
    }

    let evidenceItemsAppend: any[] | null = null;
    try {
      const parsed = JSON.parse(appendItemsJson || "[]");
      if (!Array.isArray(parsed)) {
        throw new Error("append items JSON must be an array");
      }
      evidenceItemsAppend = parsed;
    } catch (e) {
      toast.error("Invalid evidence append JSON", {
        description: e instanceof Error ? e.message : "Expected JSON array",
      });
      return;
    }

    let promptSpecOverride: Record<string, any> | null = null;
    try {
      const parsed = JSON.parse(promptSpecOverrideJson || "{}");
      if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("prompt_spec_override must be a JSON object");
      }
      promptSpecOverride = parsed;
    } catch (e) {
      toast.error("Invalid PromptSpec override JSON", {
        description: e instanceof Error ? e.message : "Expected JSON object",
      });
      return;
    }

    // reason_code determines which steps run:
    //   EVIDENCE_MISREAD      → collect → audit → judge (requires tool_plan, collectors)
    //   EVIDENCE_INSUFFICIENT → collect → audit → judge (requires evidence_urls)
    //   REASONING_ERROR       → audit → judge
    //   LOGIC_GAP             → audit → judge
    //   OTHER                 → audit → judge

    // Validate reason-specific required fields
    if (reasonCode === "EVIDENCE_MISREAD") {
      const collectorsToUse = collectors && collectors.length > 0 ? collectors : artifacts.collectors_used;
      if (!artifacts.tool_plan) {
        toast.error("tool_plan is required for EVIDENCE_MISREAD");
        return;
      }
      if (!collectorsToUse || collectorsToUse.length === 0) {
        toast.error("collectors is required for EVIDENCE_MISREAD");
        return;
      }
    }

    // Parse evidence_urls for EVIDENCE_INSUFFICIENT
    let evidenceUrls: string[] | null = null;
    if (reasonCode === "EVIDENCE_INSUFFICIENT") {
      evidenceUrls = evidenceUrlsText
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
      if (evidenceUrls.length === 0) {
        toast.error("evidence_urls is required for EVIDENCE_INSUFFICIENT");
        return;
      }
      if (evidenceUrls.length > 10) {
        toast.error("Maximum 10 evidence URLs allowed");
        return;
      }
    }

    const collectorsToUse = collectors && collectors.length > 0 ? collectors : artifacts.collectors_used ?? null;

    const payload: Record<string, any> = {
      case_id: caseId || null,
      reason_code: reasonCode,
      message: message.trim(),
      target: {
        artifact: targetArtifact,
        leaf_path: leafPath.trim() || null,
      },
      prompt_spec: artifacts.prompt_spec,
      evidence_bundle: selectedEvidenceBundle,
      reasoning_trace: artifacts.reasoning_trace ?? null,
      tool_plan: reasonCode === "EVIDENCE_MISREAD" ? (artifacts.tool_plan ?? null) : null,
      collectors: reasonCode === "EVIDENCE_MISREAD" ? collectorsToUse : null,
      evidence_urls: evidenceUrls,
      patch:
        (evidenceItemsAppend && evidenceItemsAppend.length > 0) || (promptSpecOverride && Object.keys(promptSpecOverride).length > 0)
          ? {
              ...(evidenceItemsAppend && evidenceItemsAppend.length > 0
                ? { evidence_items_append: evidenceItemsAppend }
                : {}),
              ...(promptSpecOverride && Object.keys(promptSpecOverride).length > 0
                ? { prompt_spec_override: promptSpecOverride }
                : {}),
            }
          : null,
    };

    setSubmitting(true);
    try {
      const res = await onSubmit(payload);
      toast.success("Dispute submitted", {
        description: `Reran: ${res.rerun_plan?.join(", ") || "(unknown)"}`,
      });
      onResult?.(res, { before: artifacts, evidenceBundleIndex: bundleIndex });
    } catch (e) {
      toast.error("Dispute failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const bundleOptions = (artifacts.evidence_bundles ?? []).map((b, idx) => {
    const label = b?.collector_name ? `${idx}: ${b.collector_name}` : `${idx}`;
    return { idx, label };
  });

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm">Dispute (Stateless)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Reason code</div>
            <Select value={reasonCode} onValueChange={(v) => setReasonCode(v as DisputeReasonCode)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REASONING_ERROR">REASONING_ERROR</SelectItem>
                <SelectItem value="LOGIC_GAP">LOGIC_GAP</SelectItem>
                <SelectItem value="EVIDENCE_MISREAD">EVIDENCE_MISREAD</SelectItem>
                <SelectItem value="EVIDENCE_INSUFFICIENT">EVIDENCE_INSUFFICIENT</SelectItem>
                <SelectItem value="OTHER">OTHER</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Target artifact</div>
            <Select value={targetArtifact} onValueChange={(v) => setTargetArtifact(v as DisputeTargetArtifact)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verdict">verdict (judge)</SelectItem>
                <SelectItem value="reasoning_trace">reasoning_trace (audit)</SelectItem>
                <SelectItem value="evidence_bundle">evidence_bundle</SelectItem>
                <SelectItem value="prompt_spec">prompt_spec</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Case ID (optional)</div>
            <Textarea value={caseId} onChange={(e) => setCaseId(e.target.value)} rows={1} placeholder="optional" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Leaf path (optional)</div>
            <Textarea value={leafPath} onChange={(e) => setLeafPath(e.target.value)} rows={1} placeholder="e.g. items[3].extracted_fields" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Dispute message</div>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Explain why this is a dispute..." />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Evidence bundle to send</div>
          <Select value={String(bundleIndex)} onValueChange={(v) => setBundleIndex(parseInt(v, 10))}>
            <SelectTrigger>
              <SelectValue placeholder="Select bundle" />
            </SelectTrigger>
            <SelectContent>
              {bundleOptions.map((o) => (
                <SelectItem key={o.idx} value={String(o.idx)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {reasonCode === "EVIDENCE_MISREAD"
              ? "Backend will re-collect evidence using tool_plan + collectors, then audit and judge."
              : reasonCode === "EVIDENCE_INSUFFICIENT"
                ? "Backend will collect from evidence_urls below, then audit and judge."
                : "Backend will re-run audit and judge using this bundle."}
          </p>
          {reasonCode === "EVIDENCE_MISREAD" && (!artifacts.tool_plan || !(collectors && collectors.length > 0 ? collectors : artifacts.collectors_used)?.length) && (
            <p className="text-xs text-red-400">
              Missing tool_plan or collectors; required for EVIDENCE_MISREAD.
            </p>
          )}
        </div>

        {reasonCode === "EVIDENCE_INSUFFICIENT" && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Evidence URLs (one per line, max 10)</div>
            <Textarea
              value={evidenceUrlsText}
              onChange={(e) => setEvidenceUrlsText(e.target.value)}
              rows={4}
              placeholder={"https://reuters.com/article/...\nespn.com\nhttps://example.com/data"}
            />
            <p className="text-xs text-muted-foreground">
              Full URLs (https://...) or bare domains (espn.com). Required for EVIDENCE_INSUFFICIENT.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Patch: append evidence items (JSON array, optional)</div>
          <Textarea
            value={appendItemsJson}
            onChange={(e) => setAppendItemsJson(e.target.value)}
            rows={6}
            placeholder='[{"evidence_id":"ev_new", ...}]'
          />
          <p className="text-xs text-muted-foreground">
            If provided, these EvidenceItem objects will be appended to evidence_bundle.items before rerun.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Patch: prompt_spec_override (JSON object, optional)</div>
          <Textarea
            value={promptSpecOverrideJson}
            onChange={(e) => setPromptSpecOverrideJson(e.target.value)}
            rows={8}
            placeholder='{"extra": {"assumptions": [...]}, "market": {"event_definition": "..."}}'
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                "text-xs px-2 py-1 rounded-md border border-border/50 bg-muted/20 hover:bg-muted/30",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
              onClick={() => {
                try {
                  setPromptSpecOverrideJson(JSON.stringify(artifacts.prompt_spec ?? {}, null, 2));
                } catch {
                  setPromptSpecOverrideJson("{}");
                }
              }}
            >
              Prefill with full prompt_spec
            </button>

            <button
              type="button"
              className={cn(
                "text-xs px-2 py-1 rounded-md border border-border/50 bg-muted/20 hover:bg-muted/30",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
              onClick={() => {
                const assumptions = artifacts.prompt_spec?.extra?.assumptions ?? [];
                setPromptSpecOverrideJson(JSON.stringify({ extra: { assumptions } }, null, 2));
              }}
            >
              Prefill assumptions only
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Server will deep-merge this object into the provided prompt_spec. Lists are replaced wholesale.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={disabled || submitting}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "bg-violet-500/20 text-violet-200 border border-violet-500/40 hover:bg-violet-500/25",
              (disabled || submitting) && "opacity-50 cursor-not-allowed"
            )}
          >
            {submitting ? "Generating..." : submitLabel}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
