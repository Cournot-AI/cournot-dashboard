"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRole } from "@/lib/role";
import { fetchMarket, updateMarket } from "@/lib/admin-api";
import type { AdminMarket, RunSummary, MarketExternalData, MarketClassification } from "@/lib/types";
import { MarketDetail, ExternalDataSection } from "@/components/admin/market-detail";
import { AiResultDetail } from "@/components/admin/ai-result-detail";
import { PorTrigger } from "@/components/admin/por-trigger";
import { ResolveForm } from "@/components/admin/resolve-form";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Loader2, Settings, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessCode } = useRole();
  const [market, setMarket] = useState<AdminMarket | null>(null);
  const [externalData, setExternalData] = useState<MarketExternalData[]>([]);
  const [classification, setClassification] = useState<MarketClassification | null>(null);
  const [loading, setLoading] = useState(true);
  const [porResult, setPorResult] = useState<RunSummary | null>(null);
  const [porRawResult, setPorRawResult] = useState<string | null>(null);
  const [effectiveAiPrompt, setEffectiveAiPrompt] = useState<string | null>(null);

  // ── Market settings dialog state ──
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [editExpectedResolve, setEditExpectedResolve] = useState("");
  const [editTimingType, setEditTimingType] = useState("");
  const [editSilenceMinutes, setEditSilenceMinutes] = useState<number | null>(null);
  const [editSilenceCustom, setEditSilenceCustom] = useState("");

  const SILENCE_PRESETS: { label: string; minutes: number }[] = [
    { label: "15m", minutes: 15 },
    { label: "1h", minutes: 60 },
    { label: "3h", minutes: 180 },
    { label: "6h", minutes: 360 },
    { label: "12h", minutes: 720 },
    { label: "24h", minutes: 1440 },
  ];

  function openSettings() {
    if (!market) return;
    setEditExpectedResolve(market.expected_resolve_time ? market.expected_resolve_time.slice(0, 16) : "");
    setEditTimingType(market.market_timing_type || "");
    setEditSilenceMinutes(null);
    setEditSilenceCustom("");
    setSettingsOpen(true);
  }

  async function handleSettingsSave() {
    if (!accessCode || !market) return;
    // Resolve silence deadline
    let silenceDeadline: string | undefined;
    if (editSilenceMinutes !== null && editSilenceMinutes > 0) {
      silenceDeadline = new Date(Date.now() + editSilenceMinutes * 60 * 1000).toISOString();
    }
    setSettingsLoading(true);
    try {
      await updateMarket(accessCode, market.id, {
        expected_resolve_time: editExpectedResolve ? new Date(editExpectedResolve).toISOString() : undefined,
        market_timing_type: editTimingType || undefined,
        silence_deadline: silenceDeadline,
      });
      toast.success("Market settings updated");
      setSettingsOpen(false);
      load();
    } catch {
      // Error handled by admin-api
    } finally {
      setSettingsLoading(false);
    }
  }

  const load = useCallback(async () => {
    if (!accessCode || !params.id) return;
    setLoading(true);
    try {
      const info = await fetchMarket(accessCode, Number(params.id));
      setMarket(info?.market ?? null);
      setExternalData(info?.external_data ?? []);
      setClassification(info?.classification ?? null);
    } catch {
      // Error handled by admin-api
    } finally {
      setLoading(false);
    }
  }, [accessCode, params.id]);

  useEffect(() => { load(); }, [load]);

  async function handleBackToMonitoring(silenceDeadline: string) {
    if (!accessCode || !market) return;
    try {
      await updateMarket(accessCode, market.id, {
        status: "monitoring",
        silence_deadline: silenceDeadline,
      });
      toast.success("Market moved back to monitoring");
      load();
    } catch {
      // Error handled by admin-api
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Market not found
      </div>
    );
  }

  // Use PoR raw result if available, otherwise fall back to market's ai_result
  const displayAiResult = porRawResult || market.ai_result;

  // Build the resolve form content passed into PorTrigger's Resolve tab
  const resolveForm = (displayAiResult || porResult) ? (
    <ResolveForm
      marketId={market.id}
      porResult={porResult}
      rawAiResult={displayAiResult || undefined}
      aiPrompt={effectiveAiPrompt || market.ai_prompt || undefined}
      onResolved={load}
      onRevertToMonitoring={market.status === "pending_verification" ? handleBackToMonitoring : undefined}
    />
  ) : undefined;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground">
        Admin &rarr; Market Monitor &rarr; <span className="text-foreground">{market.title}</span>
      </div>

      <MarketDetail
        market={market}
        classification={classification}
        actions={
          <button
            type="button"
            onClick={() => {
              if (market.status !== "monitoring") {
                toast.info("Settings can only be changed while the market is in monitoring status");
                return;
              }
              openSettings();
            }}
            className={cn(
              "h-7 rounded-md border border-border px-2 text-[11px] inline-flex items-center gap-1 transition-colors",
              market.status === "monitoring"
                ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                : "text-muted-foreground/40 cursor-not-allowed"
            )}
          >
            <Settings className="h-3 w-3" />
            Settings
          </button>
        }
      />

      {/* External Data */}
      {externalData.length > 0 && (
        <ExternalDataSection data={externalData} />
      )}

      {/* AI Result Detail — full evidence, reasoning, proofs */}
      {displayAiResult && (
        <AiResultDetail
          aiResult={displayAiResult}
          aiPrompt={effectiveAiPrompt || market.ai_prompt || undefined}
          resolveReasoning={market.resolve_reasoning || undefined}
        />
      )}

      {/* Action panel — shown for monitoring and pending_verification */}
      {(market.status === "monitoring" || market.status === "pending_verification") && (
        <PorTrigger
          question={market.title}
          aiPrompt={effectiveAiPrompt || market.ai_prompt || undefined}
          aiResult={displayAiResult || undefined}
          onResult={setPorResult}
          onRawResult={setPorRawResult}
          onAiPrompt={setEffectiveAiPrompt}
          resolveContent={resolveForm}
        />
      )}

      {/* resolved: read-only, no action buttons */}

      {/* Market Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Market Settings</DialogTitle>
            <DialogDescription className="text-xs">
              Update the expected resolve time and market type for this market.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Market Type</label>
              <Select value={editTimingType} onValueChange={setEditTimingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event_based">event_based</SelectItem>
                  <SelectItem value="time_based">time_based</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed">
                <strong>event_based</strong> — resolves when a triggering event occurs (continuous monitoring).{" "}
                <strong>time_based</strong> — outcome determinable after a known scheduled time.
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Expected Resolve Time</label>
              <Input
                type="datetime-local"
                value={editExpectedResolve}
                onChange={(e) => setEditExpectedResolve(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed">
                For time_based markets, set this to when the outcome becomes knowable.
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Silence Deadline</label>
              {market.silence_deadline && (
                <p className="text-[10px] text-muted-foreground/70 mb-2">
                  Current: {new Date(market.silence_deadline).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                  })}
                  {new Date(market.silence_deadline) > new Date()
                    ? <span className="text-amber-400 ml-1">(active)</span>
                    : <span className="text-muted-foreground/50 ml-1">(expired)</span>}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {SILENCE_PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => { setEditSilenceMinutes(preset.minutes); setEditSilenceCustom(""); }}
                    className={cn(
                      "h-7 rounded-md border px-2.5 text-[11px] font-medium transition-colors inline-flex items-center gap-1",
                      editSilenceMinutes === preset.minutes
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  step="0.5"
                  min="0.25"
                  value={editSilenceCustom}
                  onChange={(e) => {
                    setEditSilenceCustom(e.target.value);
                    const h = parseFloat(e.target.value);
                    setEditSilenceMinutes(h > 0 ? h * 60 : null);
                  }}
                  placeholder="Custom hours"
                  className="text-xs"
                />
                {editSilenceMinutes !== null && (
                  <button
                    type="button"
                    onClick={() => { setEditSilenceMinutes(null); setEditSilenceCustom(""); }}
                    className="h-9 shrink-0 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed">
                Silence the market for a duration so it won&apos;t be flagged again until the deadline passes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSettingsSave}
              disabled={settingsLoading}
              className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {settingsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
