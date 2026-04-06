"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRole } from "@/lib/role";
import { fetchMarket, updateMarket } from "@/lib/admin-api";
import type { AdminMarket, RunSummary, MarketExternalData, MarketClassification, MarketReview, MarketImpact } from "@/lib/types";
import { MarketDetail, ExternalDataSection, ImpactsSection } from "@/components/admin/market-detail";
import { AiResultDetail } from "@/components/admin/ai-result-detail";
import { PorTrigger } from "@/components/admin/por-trigger";
import { MarketDisputes } from "@/components/admin/market-disputes";
import { ResolveForm, ConflictReviews } from "@/components/admin/resolve-form";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Settings, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function CloseMarketAction({ onClose }: { onClose: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onClose();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 rounded-lg border border-red-500/40 bg-red-500/5 px-4 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/15 inline-flex items-center gap-2"
      >
        <XCircle className="h-3.5 w-3.5" />
        Close Market
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Close Market</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure? This permanently closes the market. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="h-9 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-600/90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Close Market
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessCode } = useRole();
  const [market, setMarket] = useState<AdminMarket | null>(null);
  const [externalData, setExternalData] = useState<MarketExternalData[]>([]);
  const [classification, setClassification] = useState<MarketClassification | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<MarketReview[]>([]);
  const [impacts, setImpacts] = useState<MarketImpact[]>([]);
  const [porResult, setPorResult] = useState<RunSummary | null>(null);
  const [porRawResult, setPorRawResult] = useState<string | null>(null);
  const [effectiveAiPrompt, setEffectiveAiPrompt] = useState<string | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);

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
      setReviews(info?.reviews ?? []);
      setImpacts(info?.impacts ?? []);
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

  async function handleCloseMarket() {
    if (!accessCode || !market) return;
    try {
      await updateMarket(accessCode, market.id, {
        status: "closed",
      });
      toast.success("Market closed");
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

  // For conflict markets, use the selected review's ai_result if one is picked
  const selectedReview = reviews.find((r) => r.id === selectedReviewId);
  const conflictAiResult = selectedReview?.ai_result ?? displayAiResult;

  // Build the resolve form content passed into PorTrigger's Resolve tab
  const isConflict = market.status === "conflict";
  const resolveForm = (
    <div className="space-y-4">
      {isConflict && reviews.length >= 2 && (
        <ConflictReviews
          reviews={reviews}
          selectedReviewId={selectedReviewId}
          onSelect={setSelectedReviewId}
        />
      )}
      <ResolveForm
        marketId={market.id}
        porResult={porResult}
        rawAiResult={isConflict ? (conflictAiResult || undefined) : (displayAiResult || undefined)}
        aiPrompt={effectiveAiPrompt || market.ai_prompt || undefined}
        mode={isConflict ? "conflict" : "review"}
        onResolved={load}
        onRevertToMonitoring={(market.status === "pending_verification" || market.status === "conflict") ? handleBackToMonitoring : undefined}
        onCloseMarket={(market.status === "monitoring" || market.status === "pending_verification" || market.status === "conflict") ? handleCloseMarket : undefined}
        requireRerun={market.status === "monitoring"}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground">
        Admin &rarr; Market Monitor &rarr; <span className="text-foreground">{market.title}</span>
      </div>

      {/* Review Status Indicator */}
      {market.status !== "resolved" && market.status !== "closed" && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">Review Status</span>
              {reviews.length === 0 && (
                <Badge variant="outline" className="text-[10px] bg-muted/20 text-muted-foreground">
                  0/2 reviews — Pending
                </Badge>
              )}
              {reviews.length === 1 && (
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400">
                  1/2 reviews — Waiting for second review
                </Badge>
              )}
              {reviews.length >= 2 && market.status === "conflict" && (
                <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400">
                  2/2 reviews — Conflict (mismatched)
                </Badge>
              )}
              {reviews.length >= 2 && market.status !== "conflict" && (
                <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400">
                  2/2 reviews — Resolved (matching)
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Event Impacts */}
      {impacts.length > 0 && (
        <ImpactsSection impacts={impacts} />
      )}

      {/* AI Result Detail — full evidence, reasoning, proofs */}
      {displayAiResult && (
        <AiResultDetail
          aiResult={displayAiResult}
          aiPrompt={effectiveAiPrompt || market.ai_prompt || undefined}
          resolveReasoning={market.resolve_reasoning || undefined}
        />
      )}

      {/* Disputes — shown for resolved markets */}
      {market.status === "resolved" && market.ai_result && (
        <MarketDisputes
          marketId={market.id}
          currentAiResult={market.ai_result}
          currentAiOutcome={market.ai_outcome}
          aiPrompt={effectiveAiPrompt || market.ai_prompt || undefined}
          isAdmin={true}
          accessCode={accessCode}
          onMarketUpdated={load}
        />
      )}

      {/* Action panel — shown for monitoring, pending_verification, and conflict */}
      {(market.status === "monitoring" || market.status === "pending_verification" || market.status === "conflict") && (
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

      {/* Closed: read-only terminal state */}
      {market.status === "closed" && (
        <Card className="border-gray-500/30 bg-gray-500/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Market Closed
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This market has been permanently closed. No further actions are available.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resolved: close market action */}
      {market.status === "resolved" && (
        <CloseMarketAction onClose={handleCloseMarket} />
      )}

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
