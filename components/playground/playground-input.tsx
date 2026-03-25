"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Play,
  Layers,
  Cpu,
  ChevronDown,
} from "lucide-react";

const ADVANCED_COLLECTOR_IDS = new Set([
  "CollectorCRP",
  "CollectorPAN",
  "CollectorAgenticRAG",
  "CollectorGraphRAG",
  "CollectorHTTP",
  "CollectorMock",
]);

const DEFERRED_DISABLED_IDS = new Set([
  "CollectorSitePinned",
  "CollectorWebPageReader",
]);

interface ProviderInfo {
  provider: string;
  default_model: string;
}

const TEMPLATES = [
  {
    label: "Gov Shutdown",
    text: `US government shutdown Saturday?\n\nThis market will resolve to "Yes" if the U.S. Office of Personnel Management (OPM) announces another federal government shutdown due to a lapse in appropriations by January 31, 2026, 11:59 PM ET. Otherwise, this market will resolve to "No".\n\nPartial shutdowns count as shutdowns; announcements of office closures due to holidays or inclement weather do not qualify as a shutdown.\n\nThe resolution source for this market will be OPM's Operating Status page (https://www.opm.gov/policy-data-oversight/snow-dismissal-procedures/current-status/).`,
  },
  {
    label: "Caroline Ellison",
    text: `Caroline Ellison new boyfriend by January 31?\n\nThis market will resolve to "Yes" if Caroline Ellison is confirmed to be in a romantic relationship with any man between market creation and January 31, 2026, 11:59 PM ET. Otherwise, this market will resolve to "No".\n\nConfirmation must come directly from Caroline Ellison or their official representative(s), or a wide consensus of credible reporting.`,
  },
  {
    label: "Fed Rate Hike",
    text: `Fed rate hike in 2025?\n\nThis market will resolve to "Yes" if the upper bound of the target federal funds rate is increased at any point between January 1, 2025 and the Fed's December 2025 meeting, currently scheduled for December 9-10. Otherwise, this market will resolve to "No".\n\nThis market may not resolve to "No" until the Fed has released its rate changes information following its December meeting.\n\nThe primary resolution source for this market will be the official website of the Federal Reserve (https://www.federalreserve.gov/monetarypolicy/openmarket.htm), however a consensus of credible reporting may also be used.\n\nCreated At: Dec 29, 2024, 5:50 PM ET`,
  },
  {
    label: "US Venezuela",
    text: `Will the U.S. invade Venezuela by March 31, 2026?\n\nThis market will resolve to "Yes" if the United States commences a military offensive intended to establish control over any portion of Venezuela between November 3, 2025 and March 31, 2026, 11:59 PM ET. Otherwise, this market will resolve to "No".\n\nFor the purposes of this market, land de facto controlled by Venezuela or the United States as of September 6, 2025, 12:00 PM ET, will be considered the sovereign territory of that country.\n\nThe resolution source for this market will be a consensus of credible sources.\n\nCreated At: Nov 3, 2025, 6:50 PM ET`,
  },
  {
    label: "META Earnings",
    text: `Will Meta Platforms (META) beat quarterly earnings?\n\nAs of market creation, Meta Platforms is estimated to release earnings on January 28, 2026. The Street consensus estimate for Meta Platforms's GAAP EPS for the relevant quarter is $8.19 as of market creation. This market will resolve to "Yes" if Meta Platforms reports GAAP EPS greater than $8.19 for the relevant quarter in its next quarterly earnings release. Otherwise, it will resolve to "No." The resolution source will be the GAAP EPS listed in the company's official earnings documents.\n\nIf Meta Platforms releases earnings without GAAP EPS, then the market will resolve according to the GAAP EPS figure reported by SeekingAlpha. If no such figure is published within 96h of market close (4:00:00pm ET) on the day earnings are announced, the market will resolve to "No".\n\nIf the company does not release earnings within 45 calendar days of the estimated earnings date, this market will resolve to "No."\n\nNote: Subsequent restatements, corrections, or revisions made to the initially announced GAAP EPS figure will not qualify for resolution, except in the case of obvious and immediate mistakes (e.g., fat finger errors, as with Lyft's (LYFT) earnings release in February 2024).\nNote: The strike prices used in these markets are derived from SeekingAlpha estimates, and reflect the consensus of sell-side analyst estimates for GAAP EPS.\nNote: All figures will be rounded to the nearest cent using standard rounding.\nNote: For the purposes of this market, IFRS EPS will be treated as GAAP EPS.\nNote: For the purposes of this market, GAAP EPS refers to diluted GAAP EPS, unless this is not published, in which case it refers to basic GAAP EPS.\nNote: All figures are expressed in USD, unless otherwise indicated.\nNote: For primarily internationally listed companies, this market refers specifically to the shares traded in the United States on U.S. stock exchanges such as the NYSE or Nasdaq. In cases where the company trades in the U.S. through an American Depositary Receipt (ADR) or American Depositary Share (ADS), this market will refer to the ADR/ADS.`,
  },
];

interface CollectorInfo {
  id: string;
  name: string;
  description: string;
}

interface PlaygroundInputProps {
  userInput: string;
  onUserInputChange: (v: string) => void;
  onPrompt: () => void;
  onResolve: () => void;
  canResolve: boolean;
  isLoading: boolean;
  compact: boolean;
  useMultiStep?: boolean;
  // Collector options
  availableCollectors?: CollectorInfo[];
  selectedCollectors?: string[];
  collectorCounts?: Record<string, number>;
  onToggleCollector?: (collectorId: string) => void;
  onCollectorCountChange?: (collectorId: string, count: number) => void;
  // Deferred source discovery
  deferredSources?: boolean;
  // LLM provider/model selection
  providers?: ProviderInfo[];
  selectedProvider?: string | null;
  selectedModel?: string;
  onProviderChange?: (provider: string | null) => void;
  onModelChange?: (model: string) => void;
}

export function PlaygroundInput({
  userInput,
  onUserInputChange,
  onPrompt,
  onResolve,
  canResolve,
  isLoading,
  compact,
  availableCollectors = [],
  selectedCollectors = [],
  collectorCounts = {},
  onToggleCollector,
  onCollectorCountChange,
  deferredSources = false,
  providers = [],
  selectedProvider = null,
  selectedModel = "",
  onProviderChange,
  onModelChange,
}: PlaygroundInputProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const primaryCollectors = availableCollectors.filter(
    (c) => !ADVANCED_COLLECTOR_IDS.has(c.id)
  );
  const advancedCollectors = availableCollectors.filter((c) =>
    ADVANCED_COLLECTOR_IDS.has(c.id)
  );

  const renderCollectorButton = (collector: CollectorInfo) => {
    const count = collectorCounts[collector.id] ?? 0;
    const isSelected = count > 0;
    const isDeferredDisabled = deferredSources && DEFERRED_DISABLED_IDS.has(collector.id);
    return (
      <div key={collector.id} className="inline-flex items-center gap-0">
        <button
          onClick={() => onToggleCollector?.(collector.id)}
          disabled={isLoading || isDeferredDisabled}
          title={isDeferredDisabled ? "Requires explicit source URLs — not available when sources are deferred" : collector.description}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-all",
            isSelected && count > 1 ? "rounded-l-md" : "rounded-md",
            isDeferredDisabled
              ? "opacity-40 cursor-not-allowed bg-muted/20 text-muted-foreground border border-border/30 line-through"
              : isSelected
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-muted/30 text-muted-foreground border border-border/50 hover:border-emerald-500/30 hover:text-emerald-300",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          <div
            className={cn(
              "w-3 h-3 rounded-sm border flex items-center justify-center",
              isSelected
                ? "border-emerald-400 bg-emerald-500"
                : "border-muted-foreground/40"
            )}
          >
            {isSelected && (
              <svg
                className="w-2 h-2 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          {collector.name}
          {isSelected && count > 1 && (
            <span className="text-[10px] text-emerald-400/80 font-normal">
              x{count}
            </span>
          )}
        </button>
        {isSelected && onCollectorCountChange && (
          <div className="inline-flex items-center border border-l-0 border-emerald-500/40 rounded-r-md overflow-hidden">
            <button
              onClick={() => onCollectorCountChange(collector.id, count - 1)}
              disabled={isLoading}
              className={cn(
                "px-1.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-colors",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              -
            </button>
            <span className="px-1 py-1 text-[11px] font-medium text-emerald-300 min-w-[18px] text-center bg-emerald-500/10">
              {count}
            </span>
            <button
              onClick={() => onCollectorCountChange(collector.id, count + 1)}
              disabled={isLoading || count >= 5}
              className={cn(
                "px-1.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-colors",
                (isLoading || count >= 5) && "opacity-50 cursor-not-allowed"
              )}
            >
              +
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
      <CardContent className={cn("space-y-4", compact ? "pt-4 pb-4" : "pt-5 pb-5")}>
        {/* Header */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold tracking-tight">Market Question</h2>
        </div>

        {/* Templates */}
        {!compact && (
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => onUserInputChange(t.text)}
                disabled={isLoading}
                className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-violet-300 hover:border-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Textarea */}
        <Textarea
          placeholder="e.g. Will the Federal Reserve cut interest rates by more than 25 basis points at the June 2025 FOMC meeting?"
          value={userInput}
          onChange={(e) => onUserInputChange(e.target.value)}
          className={cn(
            "resize-none transition-all duration-300 bg-muted/20 border-border/50 focus:border-violet-500/50",
            compact ? "min-h-[60px]" : "min-h-[120px]"
          )}
          disabled={isLoading}
        />

        {/* Action Buttons */}
        <div className={cn("space-y-3", compact ? "pt-0" : "pt-2")}>
          {/* Collector Selection (appears when prompt is done) */}
          {canResolve && onToggleCollector && availableCollectors.length > 0 && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Evidence Collectors</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {selectedCollectors.length} selected
                </span>
              </div>

              {/* Primary collectors */}
              {primaryCollectors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {primaryCollectors.map(renderCollectorButton)}
                </div>
              )}

              {/* Deferred source discovery notice */}
              {deferredSources && (
                <div className="flex items-start gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5">
                  <span className="text-blue-400 text-sm leading-none mt-0.5">&#9432;</span>
                  <span className="text-[11px] text-blue-300/90">
                    Source discovery is deferred — no explicit URLs are available in the prompt spec. SitePinned and WebPageReader are disabled because they require known source URLs.
                  </span>
                </div>
              )}

              {/* Advanced collectors toggle */}
              {advancedCollectors.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-emerald-300 transition-colors"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        showAdvanced && "rotate-180"
                      )}
                    />
                    Advanced Collectors ({advancedCollectors.length})
                  </button>
                  {showAdvanced && (
                    <div className="flex flex-wrap gap-1.5">
                      {advancedCollectors.map(renderCollectorButton)}
                    </div>
                  )}
                </>
              )}

              {/* Selected collectors description panel */}
              {selectedCollectors.length > 0 && (
                <div className="space-y-1 border-t border-emerald-500/20 pt-2">
                  {availableCollectors
                    .filter((c) => (collectorCounts[c.id] ?? 0) > 0)
                    .map((c) => (
                      <div key={c.id} className="text-[11px] text-emerald-300/80">
                        <span className="font-semibold text-emerald-300">{c.name}</span>
                        {" — "}
                        {c.description}
                      </div>
                    ))}
                </div>
              )}

              {selectedCollectors.some((c) => c.toLowerCase().includes("graphrag")) && (
                <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5">
                  <span className="text-amber-400 text-sm leading-none mt-0.5">&#9888;</span>
                  <span className="text-[11px] text-amber-300/90">
                    GraphRAG builds a knowledge graph before reasoning. This may take a few minutes to resolve.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* LLM Provider/Model Selection (appears when prompt is done) */}
          {canResolve && providers.length > 0 && onProviderChange && onModelChange && (() => {
            const hasGemini = selectedCollectors.some((c) => c.toLowerCase().includes("geminigrounded"));
            const onlyGemini = hasGemini && selectedCollectors.length === 1;
            return (
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs font-medium text-violet-400">LLM Provider</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {selectedProvider ?? "server default"}
                </span>
              </div>
              {onlyGemini && (
                <div className="flex items-start gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5">
                  <span className="text-blue-400 text-sm leading-none mt-0.5">&#9432;</span>
                  <span className="text-[11px] text-blue-300/90">
                    GeminiGrounded requires the Google provider. Provider is locked to Google.
                  </span>
                </div>
              )}
              {hasGemini && !onlyGemini && (
                <div className="flex items-start gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5">
                  <span className="text-blue-400 text-sm leading-none mt-0.5">&#9432;</span>
                  <span className="text-[11px] text-blue-300/90">
                    LLM Provider selection does not affect GeminiGrounded — it always uses the Google provider.
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedProvider ?? ""}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    onProviderChange(value);
                    if (value) {
                      const info = providers.find((p) => p.provider === value);
                      if (info) onModelChange(info.default_model);
                    } else {
                      onModelChange("");
                    }
                  }}
                  disabled={isLoading || onlyGemini}
                  className={cn(
                    "rounded-md border bg-muted/20 px-2.5 py-1 text-xs transition-colors",
                    "border-violet-500/30 focus:border-violet-500/50 focus:outline-none",
                    (isLoading || onlyGemini) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <option value="">Server Default</option>
                  {providers.map((p) => (
                    <option key={p.provider} value={p.provider}>
                      {p.provider}
                    </option>
                  ))}
                </select>
                {selectedProvider && (
                  <input
                    type="text"
                    value={selectedModel}
                    onChange={(e) => onModelChange(e.target.value)}
                    placeholder="Model name"
                    disabled={isLoading || onlyGemini}
                    className={cn(
                      "rounded-md border bg-muted/20 px-2.5 py-1 text-xs transition-colors flex-1 min-w-[200px]",
                      "border-violet-500/30 focus:border-violet-500/50 focus:outline-none",
                      (isLoading || onlyGemini) && "opacity-50 cursor-not-allowed"
                    )}
                  />
                )}
              </div>
            </div>
          );
          })()}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onPrompt}
              disabled={!userInput.trim() || isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Prompt &amp; Validate
            </button>
            <button
              onClick={onResolve}
              disabled={!canResolve || isLoading}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                canResolve && !isLoading
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Play className="h-3.5 w-3.5" />
              Resolve
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
