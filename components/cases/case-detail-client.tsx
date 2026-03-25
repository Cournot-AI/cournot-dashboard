"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  SourceStatusBadge,
  PlatformBadge,
} from "@/components/shared/status-badge";
import { InlineCopyButton } from "@/components/shared/copy-field";
import { ParseFailedBanner } from "@/components/shared/error-callout";
import { HeroPending } from "@/components/detail/hero-pending";
import { HeroResolved } from "@/components/detail/hero-resolved";
import { ProofNarrative } from "@/components/detail/proof-narrative";
import { PillarUnderstanding } from "@/components/detail/pillar-understanding";
import { PillarPerformance } from "@/components/detail/pillar-performance";
import { PillarTrust } from "@/components/detail/pillar-trust";
import { DeepTabs } from "@/components/detail/deep-tabs";
import { DiscoveredSourcesCard } from "@/components/detail/discovered-sources";
import { ReasoningTraceCard } from "@/components/detail/reasoning-trace";
import { TimelineSection } from "@/components/detail/timeline";
import { EvidenceSection } from "@/components/detail/evidence-section";
import { fetchEventById } from "@/lib/api";
import { trackCaseDetailView } from "@/lib/analytics";
import type { MarketCase } from "@/lib/types";

interface CaseDetailClientProps {
  eventId: string;
}

export function CaseDetailClient({ eventId }: CaseDetailClientProps) {
  const router = useRouter();

  const [c, setCase] = useState<MarketCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCase() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchEventById(eventId);
        if (!result) {
          setError("Event not found");
        } else {
          setCase(result);
          trackCaseDetailView(eventId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setIsLoading(false);
      }
    }
    loadCase();
  }, [eventId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/cases" className="hover:text-foreground transition-colors">
            Cases
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Error</span>
        </nav>

        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <div className="text-center">
            <p className="text-lg font-medium text-red-400">
              {error === "Event not found" ? "Event Not Found" : "Failed to Load Event"}
            </p>
            <p className="text-sm text-red-400/70 mt-1">{error}</p>
          </div>
          <button
            onClick={() => router.push("/cases")}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Back to Cases
          </button>
        </div>
      </div>
    );
  }

  if (!c) return null;

  // Determine layout: pending (no oracle result + unresolved) vs resolved
  const isPending = !c.oracle_result && c.source.official_outcome === "UNKNOWN";
  const isResolved = c.oracle_result !== null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/cases" className="hover:text-foreground transition-colors">
          Cases
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground truncate max-w-[300px]">{c.source.title}</span>
      </nav>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5 flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight">{c.source.title}</h1>
            <p className="text-sm text-muted-foreground">{c.source.question}</p>
          </div>
          <a
            href={c.source.event_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          >
            Open in {c.source.platform}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlatformBadge platform={c.source.platform} />
          <SourceStatusBadge status={c.source.status} />
          <Badge variant="outline" className="text-[10px] font-mono">
            {c.parse_result.metadata.question_type}
          </Badge>
          {c.parse_result.prompt_spec && (
            <Badge variant="outline" className="text-[10px] font-mono">
              v{c.parse_result.prompt_spec.schema_version}
            </Badge>
          )}
          <div className="flex items-center gap-1 ml-2">
            <span className="text-[11px] font-mono text-muted-foreground">{c.market_id}</span>
            <InlineCopyButton value={c.market_id} label="Market ID" />
          </div>
        </div>
      </div>

      {/* Parse failed banner */}
      {!c.parse_result.ok && c.parse_result.error && (
        <ParseFailedBanner error={c.parse_result.error} />
      )}

      {/* ═══ HERO: Layout A (Pending) or Layout B (Resolved) ═══ */}
      {isPending ? <HeroPending c={c} /> : <HeroResolved c={c} />}

      {/* ═══ Evidence Section (resolved cases with evidence items) ═══ */}
      {isResolved && c.oracle_result?.evidence_items && c.oracle_result.evidence_items.length > 0 && (
        <EvidenceSection result={c.oracle_result} />
      )}

      {/* ═══ PROOF NARRATIVE (resolved cases only) ═══ */}
      {!isPending && c.oracle_result && <ProofNarrative c={c} />}

      {/* ═══ DISCOVERED SOURCES (if deferred discovery) ═══ */}
      {c.oracle_result?.discovered_sources && c.oracle_result.discovered_sources.length > 0 && (
        <DiscoveredSourcesCard sources={c.oracle_result.discovered_sources} />
      )}

      {/* ═══ REASONING TRACE ═══ */}
      {c.oracle_result?.reasoning_steps && c.oracle_result.reasoning_steps.length > 0 && (
        <ReasoningTraceCard
          steps={c.oracle_result.reasoning_steps}
          evidenceSummary={c.oracle_result.evidence_summary}
          reasoningSummary={c.oracle_result.reasoning_summary}
        />
      )}

      {/* ═══ THREE PILLARS + TIMELINE ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {/* Pillar 1: AI Understanding */}
          <PillarUnderstanding c={c} />

          {/* Pillar 2: Performance */}
          <PillarPerformance c={c} />

          {/* Pillar 3: Trust & Proof */}
          <PillarTrust c={c} />
        </div>

        {/* Right column: Timeline */}
        <div className="space-y-6">
          <TimelineSection c={c} />
        </div>
      </div>

      {/* ═══ DEEP-LINKABLE TABS ═══ */}
      <DeepTabs c={c} />
    </div>
  );
}
